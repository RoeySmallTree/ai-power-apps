#!/usr/bin/env python3
"""Check plugin compatibility without credentials or calls to AI Power Ups.

Cursor schemas come from the official cursor/plugins repository, pinned for
reproducible CI. --cursor-schema-dir uses downloaded copies for offline runs.
Requires Python 3.9+ and scripts/requirements-plugin-checks.txt.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
from urllib.request import urlopen

import jsonschema
import yaml

try:
    import tomllib
except ModuleNotFoundError:
    import tomli as tomllib


ROOT = Path(__file__).resolve().parents[1]
CURSOR_COMMIT = "23e4138daa01c42d4969f7a5465f82704e64f798"
CURSOR_SCHEMA_HASHES = {
    "plugin": "31db124b1c7e43c22abb13ebf7e7c74556482e480fd492b80638d815c85b96b1",
    "marketplace": "50c85058bf329588401fd2fc93180a574fa64abbb6c2606400febfb6f4d094e8",
}
DISPLAY_NAME = "AI Power Ups (apu)"
MCP_URL = "https://api.powerups-ai.store/mcp"
PLUGIN_IDS = {
    ".claude-plugin": "ai-power-apps",
    ".cursor-plugin": "ai-powerups",
    ".grok-plugin": "ai-powerups",
}


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def read_skill(path):
    text = (ROOT / path).read_text(encoding="utf-8")
    match = re.fullmatch(r"---\n(.*?)\n---\n(.*)", text, re.DOTALL)
    assert match, f"{path}: missing YAML frontmatter"
    metadata = yaml.safe_load(match[1])
    assert isinstance(metadata, dict), f"{path}: frontmatter must be a mapping"
    assert metadata.get("name") == path.parent.name, f"{path}: skill name must match its directory"
    assert isinstance(metadata.get("description"), str) and metadata["description"].strip(), path
    return metadata, match[2]


def cursor_schema(kind, directory):
    name = f"{kind}.schema.json"
    if directory:
        raw = (directory / name).read_bytes()
    else:
        url = f"https://raw.githubusercontent.com/cursor/plugins/{CURSOR_COMMIT}/schemas/{name}"
        with urlopen(url, timeout=30) as response:
            raw = response.read()
    assert hashlib.sha256(raw).hexdigest() == CURSOR_SCHEMA_HASHES[kind], f"Unexpected Cursor schema: {name}"
    schema = json.loads(raw)
    jsonschema.Draft7Validator.check_schema(schema)
    return jsonschema.Draft7Validator(schema, format_checker=jsonschema.FormatChecker())


def check_plugins(schema_dir):
    for host, plugin_id in PLUGIN_IDS.items():
        manifest = read_json(f"{host}/plugin.json")
        assert manifest["name"] == plugin_id, f"{host}: existing install ID changed"
        assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"]), host
        assert manifest["mcpServers"] == "./.mcp.json", f"{host}: MCP config changed"
        assert manifest["skills"] == "./skills/", f"{host}: both skill entrypoints must load"
        assert not manifest["description"].startswith(DISPLAY_NAME), host  # apu is a shortcut, not the brand
        assert "apu" in manifest["keywords"], host
        if host != ".grok-plugin":
            assert manifest["displayName"] == DISPLAY_NAME, host
        else:
            assert "displayName" not in manifest, "Grok ignores manifest displayName"

        catalog = read_json(f"{host}/marketplace.json")
        assert catalog["name"] == plugin_id, f"{host}: existing marketplace ID changed"
        assert len(catalog["plugins"]) == 1, host
        entry = catalog["plugins"][0]
        assert entry["name"] == plugin_id and entry["source"] == "./", host
        assert not entry["description"].startswith(DISPLAY_NAME), host
        assert not catalog["metadata"]["description"].startswith(DISPLAY_NAME), host

    assert read_json(".mcp.json") == {
        "mcpServers": {"ai-power-apps": {"type": "http", "url": MCP_URL}}
    }, "Existing MCP endpoint/auth configuration changed"
    gemini = read_json("gemini-extension.json")
    assert gemini["name"] == "ai-power-apps", "Existing Gemini extension ID changed"
    assert re.fullmatch(r"\d+\.\d+\.\d+", gemini["version"])
    assert gemini["mcpServers"] == {"ai-power-apps": {"httpUrl": MCP_URL}}
    assert gemini["contextFileName"] == "GEMINI.md"
    assert "displayName" not in gemini, "Gemini has no separate displayName field"
    assert not gemini["description"].startswith(DISPLAY_NAME)
    assert (ROOT / gemini["contextFileName"]).is_file()

    for kind in ("plugin", "marketplace"):
        cursor_schema(kind, schema_dir).validate(read_json(f".cursor-plugin/{kind}.json"))
    logo = read_json(".cursor-plugin/plugin.json")["logo"]
    assert (ROOT / logo).is_file(), "Cursor logo must remain on the plugin manifest"
    print(f"PASS manifests, existing IDs/MCP configuration, Cursor schemas ({CURSOR_COMMIT})")


def check_entrypoints():
    canonical, canonical_body = read_skill(Path("skills/ai-power-apps/SKILL.md"))
    alias, alias_body = read_skill(Path("skills/apu/SKILL.md"))
    assert alias["user-invocable"] is True, "apu must appear in the slash-command menu"
    assert alias["disable-model-invocation"] is True, "apu is an explicit shortcut"
    assert not canonical.get("disable-model-invocation", False), "Keep canonical automatic discovery"
    assert canonical.get("user-invocable", True), "Keep the existing canonical command"
    assert "allowed-tools" not in alias and "allowed-tools" not in canonical, "Do not add tool permissions"
    assert alias_body == canonical_body, "apu instructions drifted from skills/ai-power-apps/SKILL.md"
    # Keep shared guidance in sync while preserving the existing provider-specific
    # Sharpen instructions in GEMINI.md.
    gemini_body = (ROOT / "GEMINI.md").read_text(encoding="utf-8")
    assert canonical_body.lstrip().split("## Searching", 1)[0] == gemini_body.split("## Searching", 1)[0]
    def sections(body):
        parts = re.split(r"^## (.+)\n", body, flags=re.MULTILINE)
        return dict(zip(parts[1::2], parts[2::2]))
    canonical_sections = sections(canonical_body)
    gemini_sections = sections(gemini_body)
    assert canonical_sections.keys() == gemini_sections.keys(), "Gemini guidance sections drifted"
    for heading in canonical_sections.keys() - {"Sharpen"}:
        assert canonical_sections[heading] == gemini_sections[heading], f"Gemini {heading} guidance drifted"

    with (ROOT / "commands/apu.toml").open("rb") as source:
        command = tomllib.load(source)
    # Mirrors the official Gemini FileCommandLoader schema: a prompt string and
    # optional description. Keep this entrypoint prompt-only and preserve args.
    assert set(command) == {"prompt", "description"}, "Unexpected Gemini command fields"
    assert all(isinstance(value, str) and value.strip() for value in command.values())
    prompt = command["prompt"]
    assert prompt.count("{{args}}") == 1, "Pass the user's request exactly once"
    assert not re.search(r"[!@]\{", prompt), "The shortcut must not run shell/file interpolation"
    assert "GEMINI.md" in prompt, "Use the extension's canonical Gemini instructions"
    print("PASS canonical/apu skill identity, invocation flags and Gemini TOML command")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cursor-schema-dir", type=Path, help="Directory containing the pinned official schemas")
    args = parser.parse_args()
    check_plugins(args.cursor_schema_dir)
    check_entrypoints()


if __name__ == "__main__":
    main()

# AI Power Ups

![AI Power Ups](https://tmfesyrmnaihvpmfvdkb.supabase.co/storage/v1/object/public/brand-assets/ai-power-ups/logo-bf0cb1a910ca.png)

Live data from the real world and a performance stage for the AI you already use — one connection, you choose what's on.

Call it **apu** for short. AI Power Ups, AI Powerups, Powerups and apu all refer to the same integration.

AI Powerups is an upgrade layer for the AI you already use. Connect it once and your AI can reach the live world — flights, hotels and routes; markets and companies; papers, patents, scriptures and classics; repos, recipes, weather, what people are saying — and keep working through it: more options, a closer look, the next page, a booking link.

Then choose its stage. From Stage 1 to Stage 3+, your AI answers with more behind it. Same model, beyond stock.

And it keeps your work. Projects is a private file space your AIs share: save a plan to a project in one, and pick it up in another.

You pick what's on. Your AI discovers the rest — what it can do, how to ask, where to go next. New powerups arrive on the same connection. Nothing to reinstall.

Travel & places · Shopping · Markets & jobs · Real estate · News & trends · Reading & research · Music & video · Code & GitHub · Weather & environment · Food & fitness · Social · Projects · Stages — more on the way.

## Try asking

- Plan a long weekend in Tokyo for two adults and a six-year-old, mid-April, about $4k — flights, a hotel near Shinjuku, and how we get there from the airport.
- Give me a five-minute briefing on NVIDIA: today's price, where the revenue comes from, and what the hype leaves out.
- I'm writing an essay on whether the internet can forget someone. Find the research, the original 1890 argument, and compare a US case with an EU one.
- Ecclesiastes 4:6 in three translations — and the verse before it.
- Two-beds under $420k with a second room. Drop anything more than 35 minutes from the office, and tell me what each last sold for.
- Find offline voice-journal repos and check whether transcription actually runs locally.
- Eight weeks to a 10k with an iffy knee: exercises, a plan, this weekend's weather, and dinners that become tomorrow's lunch.
- Is the beach beginner-sized tomorrow morning, who teaches there, and can three of us get there without a car?
- Before you answer this one, take it to Stage 3+.
- Save this plan to a project — I'll pick it up in another chat.
- We're back on the Lisbon offsite project. What's still open?

## Use the apu shortcut

After installing or updating the plugin and restarting your host, use `/apu` with a task:

```text
/apu Find recent papers on urban heat islands.
/apu Save this plan to my Lisbon offsite project.
```

You can also ask “Use apu to find recent papers on urban heat islands” in ordinary chat.
Invoking the shortcut without a task asks what you want help with. It uses your existing
connection and enabled features, keeps your saved stage, and grants no extra permissions.

| Host | Shortcut | If the short name is unavailable or already used |
| --- | --- | --- |
| Claude Code | `/apu` when unambiguous | `/ai-power-apps:apu` |
| Cursor | `/apu` | Select this plugin's `apu` skill in the slash-command menu. |
| Grok Build | `/apu` when unambiguous | `/ai-powerups:apu` |
| Gemini CLI | `/apu` | `/ai-power-apps.apu` is the documented collision fallback; see the version note below. |

Claude and Cursor support the display name **AI Power Ups (apu)**. Grok Build and
Gemini keep their existing plugin/extension names and include the shortcut in descriptions;
Grok Build ignores the catalog's `displayName`. Hosts decide how much of that metadata to show.
The installation IDs, `ai-power-apps` MCP server and existing `ai-power-apps` skill remain unchanged.
A server-only MCP connection provides tools, but does not install slash commands.

Gemini version note: the [extension reference](https://geminicli.com/docs/extensions/reference/#conflict-resolution)
documents a dot separator, while the [current upstream resolver](https://github.com/google-gemini/gemini-cli/blob/fb972b2f87fe7d5b06d37eac711490162d98de2c/packages/cli/src/services/SlashCommandResolver.ts#L167)
uses a colon for extension commands (`/ai-power-apps:apu`) and may add a numeric suffix for
further collisions. Check `/help` for the name your installed version exposes. The shortcut is
implemented as a prompt-only [custom command](commands/apu.toml); it executes no shell interpolation.
Claude's [skill naming rules](https://code.claude.com/docs/en/skills#how-a-skill-gets-its-command-name)
and Cursor's [skill invocation rules](https://cursor.com/docs/skills) describe their host behavior.

The shortcut files are part of this source change; the immutable `v1.0.6` SDK source release
below predates them. Existing installations need a plugin update containing these files.

## Claude Code

```sh
claude plugin marketplace add RoeySmallTree/ai-power-apps
claude plugin install ai-power-apps@ai-power-apps
```

Restart Claude Code, open `/mcp`, select `ai-power-apps` and authenticate. Sign in to
AI Power Ups in your browser and allow the connection. This is our own marketplace;
listing in Anthropic's public directory is pending.

## Cursor

In Customize, choose **From GitHub Repository**, import
`https://github.com/RoeySmallTree/ai-power-apps`, and install the `ai-powerups` plugin
shown as **AI Power Ups (apu)**. Authenticate its `ai-power-apps` MCP server, then select
`apu` from the slash-command menu. The [Cursor plugin guide](https://cursor.com/docs/skills#installing-skills-from-a-repository)
describes importing repository marketplaces.

## Gemini CLI

Gemini CLI needs Gemini Code Assist Standard/Enterprise or a paid Gemini or Enterprise Agent Platform API key for model access. Personal Google sign-in is no longer supported; see [Google’s access notice](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/). This is separate from signing in to AI Power Ups, which does not require an AI Power Ups API key.

```sh
gemini extensions install https://github.com/RoeySmallTree/ai-power-apps
```

Restart Gemini CLI and authenticate the `ai-power-apps` MCP server with `/mcp auth`.
Complete sign-in and consent in your browser. This extension is eligible for the
Gemini CLI extensions gallery; discoverability depends on its indexing.

## Grok Build

Install the plugin directly from this public repository:

```sh
grok plugin install https://github.com/RoeySmallTree/ai-power-apps --trust
```

The plugin is named `ai-powerups` and exposes the `ai-power-apps` MCP server.
Sign in to AI Power Ups and allow the OAuth connection when Grok Build requests it.
The server is `https://api.powerups-ai.store/mcp`; no API key is embedded in the plugin.
The public xAI marketplace submission is pending; this command installs from our repository.

For a server-only connection, use:

```sh
grok mcp add --transport http ai-power-apps https://api.powerups-ai.store/mcp
```

The Cursor/Grok Bot plugin uses the [app icon on its background plate](assets/logo-plated.png), a 512×512 PNG.
The [transparent icon](assets/logo.png) is kept for hosts that draw their own background.
Grok Build's catalog schema does not document an icon field.

## Use

Ask for academic papers, local weather, a book's details, or a second opinion on a
draft. The assistant discovers capabilities, inspects inputs, executes searches,
and follows up using the returned IDs. Ask it to save work to a project and any assistant
you connect can continue it; project files are private to your account. Free accounts
receive 500 usage tokens each month. Free sources use no tokens; paid sources and
Sharpen consume the allowance. Projects uses no tokens and is limited only by your
plan's storage allowance.

The assistant sends search parameters to AI Power Ups and its search providers.
Sharpen sends the task and draft through OpenRouter to the reviewing model provider.
Never include secrets or content you do not have permission to share. Disconnect
at any time from [Connected apps](https://powerups-ai.store/app/connections) in your AI Power Ups dashboard. Browser sign-in does not require an API key.

- [Documentation](https://powerups-ai.store/docs)
- [Privacy](https://powerups-ai.store/privacy)
- [Terms](https://powerups-ai.store/terms)
- [Plans](https://powerups-ai.store/pricing)
- Support: roey@smalltree.io

## REST client and samples

Applications can use the [REST quickstart](https://powerups-ai.store/docs/quickstart) without an
SDK. This source release also includes a [thin TypeScript client](sdk/typescript/README.md),
a [TypeScript sample](samples/typescript/quickstart.ts) and a standard-library
[Python sample](samples/python/quickstart.py). The TypeScript package is not published on npm.

For the SDK source release, clone the immutable tag and build a local package:

```sh
git clone --branch v1.0.6 --depth 1 https://github.com/RoeySmallTree/ai-power-apps.git
cd ai-power-apps
npm ci --prefix sdk/typescript
npm pack ./sdk/typescript --pack-destination /tmp --json
```

Read the `filename` from the JSON output (SDK 0.1.0 produces `ai-power-ups-api-0.1.0.tgz`).
Install the absolute tarball path into your own app with `npm install`, or run the sample:

```sh
npm ci --prefix samples/typescript
npm install --prefix samples/typescript --no-save --package-lock=false /tmp/ai-power-ups-api-0.1.0.tgz
AIPA_API_KEY=your_server_side_key npm start --prefix samples/typescript
```

For Python 3.10 or later, no third-party package is needed:

```sh
AIPA_API_KEY=your_server_side_key python3 samples/python/quickstart.py
```

The samples call the live API sequentially using the free academic capability. Use a disposable
Free-account key, keep it server-side, and revoke it afterwards. `AIPA_API_ORIGIN` can point to
your own test endpoint. The SDK's [package checks](sdk/typescript/README.md#verify-the-distributable)
run without API credentials. Repository tags and Claude/Gemini/SDK versions are independent.

This repository contains the plugin and extension manifests, REST client, samples and instructions. The
hosted service is operated by Small Tree. No server code or credentials are bundled.

## Check plugin compatibility locally

```sh
python3 -m venv /tmp/ai-power-apps-checks
/tmp/ai-power-apps-checks/bin/python -m pip install -r scripts/requirements-plugin-checks.txt
/tmp/ai-power-apps-checks/bin/python scripts/check-plugins.py
```

The checker validates the Cursor manifests against the official schemas at a pinned upstream
commit, preserves install IDs and MCP configuration, parses the Gemini command, and verifies
that `skills/apu/SKILL.md` has the same body as the canonical `skills/ai-power-apps/SKILL.md`.
Edit both skill bodies together; keep their different invocation metadata. It makes no service
calls. For offline schema checks, pass `--cursor-schema-dir` pointing to the two pinned schema
files (`plugin.schema.json` and `marketplace.schema.json`).

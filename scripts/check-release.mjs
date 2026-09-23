// Run after merging the reviewed candidate and immediately before creating its tag.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const tag = process.argv[2];
assert(/^v\d+\.\d+\.\d+$/.test(tag ?? ''), 'Pass the intended repository release tag');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
git('fetch', 'origin', 'main', '--tags');
assert.equal(git('rev-parse', 'HEAD'), git('rev-parse', 'origin/main'), 'Release the reviewed current public main');
assert.equal(git('status', '--porcelain'), '', 'Release checkout must be clean');
assert.equal(git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`), '', 'Tag already published; choose a new tag and update the README');
assert(!git('tag', '--list', tag), 'Tag already exists locally');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const match = readme.match(/git clone --branch (v\d+\.\d+\.\d+) --depth 1/);
assert.equal(match?.[1], tag, 'README source-install tag must equal the release tag');
console.log(`PASS ${tag}: fresh remote tags, clean current main, exact README tag`);

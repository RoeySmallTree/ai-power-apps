// Exercise the package a consumer receives, outside the source checkout. No API credentials.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sdk = fileURLToPath(new URL('../', import.meta.url));
const sample = resolve(sdk, '../../samples/typescript');
const temp = mkdtempSync(join(tmpdir(), 'aipa-package-consumer-'));
const run = (cmd, args, cwd = temp) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
const sampleLock = readFileSync(join(sample, 'package-lock.json'), 'utf8');
try {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', temp], { cwd: sdk, encoding: 'utf8' }));
  assert.equal(packed.length, 1);
  assert(packed[0].files.some(file => file.path === 'dist/generated/openapi.d.ts'));
  const tarball = join(temp, packed[0].filename);
  writeFileSync(join(temp, 'package.json'), JSON.stringify({ name: 'isolated-consumer', private: true, type: 'module' }));
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', tarball]);
  writeFileSync(join(temp, 'consumer.ts'), `
import { AiPowerUps, type CapabilityParams, type RecordOf } from '@ai-power-ups/api';
type IsAny<T> = 0 extends (1 & T) ? true : false;
const notAny: IsAny<CapabilityParams<'academic.search'>> = false;
const recordNotAny: IsAny<RecordOf<'hotels.search'>> = false;
const aipa = new AiPowerUps({ apiKey: 'apa_fixture_not_a_credential' });
void aipa.execute('academic.search', { query: 'typed' });
// @ts-expect-error unknown fields must stay rejected even with skipLibCheck
void aipa.execute('academic.search', { query: 'typed', bogus: true });
// @ts-expect-error invalid capability
void aipa.execute('not.a.capability', { query: 'typed' });
// @ts-expect-error missing required dates
void aipa.execute('hotels.search', { destination: 'Lisbon' });
// @ts-expect-error documented record keys retain their types
const bad: RecordOf<'hotels.search'> = { record_id: 'r', title: 'hotel', price_per_night: 'cheap' };
void [notAny, recordNotAny, bad];
`);
  for (const skipLibCheck of [false, true]) {
    writeFileSync(join(temp, 'tsconfig.json'), JSON.stringify({ compilerOptions: {
      target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true,
      exactOptionalPropertyTypes: true, noUncheckedIndexedAccess: true, noEmit: true,
      skipLibCheck, types: [],
    }, include: ['consumer.ts'] }));
    run(process.execPath, [join(sdk, 'node_modules/typescript/bin/tsc'), '-p', 'tsconfig.json']);
    console.log(`PASS clean packed consumer skipLibCheck=${skipLibCheck}`);
  }
  run(process.execPath, ['--input-type=module', '-e', "import { AiPowerUps } from '@ai-power-ups/api'; if (typeof AiPowerUps !== 'function') throw Error('Missing export');"]);
  // Install ordinary sample dependencies first; consume this exact artifact, never a registry name.
  run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], sample);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-save', '--package-lock=false', tarball], sample);
  run('npm', ['run', 'typecheck'], sample);
  run(process.execPath, ['--input-type=module', '-e', "import { AiPowerUps } from '@ai-power-ups/api'; if (typeof AiPowerUps !== 'function') throw Error('Missing export');"], sample);
  assert.equal(readFileSync(join(sample, 'package-lock.json'), 'utf8'), sampleLock);
  console.log('PASS packed package import and sample consumption; lockfile unchanged');
} finally {
  rmSync(temp, { recursive: true, force: true });
}

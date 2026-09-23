import { copyFile, mkdir } from 'node:fs/promises';
await mkdir(new URL('../dist/generated/', import.meta.url), { recursive: true });
await copyFile(
  new URL('../src/generated/openapi.d.ts', import.meta.url),
  new URL('../dist/generated/openapi.d.ts', import.meta.url),
);

# @ai-power-ups/api

Thin typed client for the [AI Power Ups](https://powerups-ai.store) REST API. Types are
generated from the public OpenAPI document, which has one operation per capability, so every
`execute` body is checked at compile time. Documentation: <https://powerups-ai.store/docs>.

## Install from source

The client is distributed as source in this repository; it is not published on npm.
Use Node.js 20 or later and npm. From the repository root:

```sh
npm ci --prefix sdk/typescript
# prepack builds JavaScript and copies the generated declarations into the package
npm pack ./sdk/typescript --pack-destination /tmp --json
```

Use the `filename` reported by that command. From your own application directory:

```sh
npm install /tmp/ai-power-ups-api-0.1.0.tgz
```

The import below resolves the installed tarball. It does not fetch an unpublished npm package.
For an immutable checkout, use the source release tag linked from the main README.

```ts
import { AiPowerUps, AipaError } from '@ai-power-ups/api';

const aipa = new AiPowerUps({ apiKey: process.env.AIPA_API_KEY! }); // server-side only

const page = await aipa.execute('academic.search', { query: 'transformer attention', num: 5 });
for await (const record of aipa.pages('academic.search', { query: 'graph neural networks' }, { maxPages: 3 })) {
  console.log(record.title);
}
const detail = await aipa.followUp({ record_id: page.results[0]!.record_id, action: 'details' });
try {
  await aipa.execute('weather.forecast', { location: 'Lisbon' });
} catch (err) {
  if (err instanceof AipaError && err.code === 'rate_limited') {
    /* wait err.retryAfterSeconds, re-check your ledger, then decide whether to repeat */
  }
}
```

What it adds on top of `openapi-fetch`:

- `execute(id, params)` typed by capability id (`CapabilityParams<'hotels.search'>`); its result
  is `ExecuteResponseOf<Id>`, whose records (`RecordOf<Id>`) carry that capability's documented
  keys as optional properties, extra keys allowed.
- `followUp(input)` whose return type follows `search_id` (execute envelope) or `record_id`.
- `pages(id, params, { maxPages })`: async iterator over `more`; stops on `has_more: false`,
  tolerates empty pages, bounds the page count.
- All calls of one client are serialised, because the API admits one metered call per account
  at a time (a concurrent call gets `429 rate_limited` with `Retry-After`).
- `AipaError` with `code`, `status`, `retryable`, `requestId`, `hint`, `violations`,
  `retryAfterSeconds`.
- Retry policy: reads and record actions are repeated on `rate_limited`, provider failures and
  transport errors (3 attempts, honouring `Retry-After`); a completed record action is cached so
  its repeat is normally free. Execute, `more` and `update` are never repeated automatically:
  the API cannot promise that a failed mutating call left the session unchanged and unbilled,
  so a repeat may advance a page or bill again. `retry: { mutating: true }` opts in to repeating
  `429 rate_limited` on those calls. Sharpen is never repeated.

`--default-non-nullable=false` keeps request fields that have a server-side default optional in
the generated types (openapi-typescript otherwise marks them required).

Regenerate the types after a contract change (dates are in `info.x-aipa-contract-date`):

```sh
npm run generate   # openapi-typescript … --default-non-nullable=false
npm run typecheck
```

No server code of the service is included here; the only inputs are the public OpenAPI
document and this source.

## Verify the distributable

From the repository root:

```sh
npm ci --prefix sdk/typescript
npm run typecheck --prefix sdk/typescript
npm test --prefix sdk/typescript
npm run check:package --prefix sdk/typescript
```

The final command packs to a temporary directory, installs the artifact in a clean external
consumer, checks valid and invalid calls with `skipLibCheck` both true and false, imports it
in Node, then installs that same tarball into the TypeScript sample and checks its package
import. It does not call the live API. The sample lockfile must remain unchanged.

/**
 * AI Power Ups quickstart in TypeScript, using the locally packed @ai-power-ups/api client.
 * Runs the acceptance checks from https://powerups-ai.store/docs/quickstart with a free
 * capability (0 credits), at most eight sequential requests.
 *
 *   AIPA_API_KEY=apa_live_… npx tsx quickstart.ts            # production
 *   AIPA_API_KEY=… AIPA_API_ORIGIN=http://127.0.0.1:5601 npx tsx quickstart.ts
 */
import { AiPowerUps, AipaError } from '@ai-power-ups/api';

const apiKey = process.env['AIPA_API_KEY'];
if (apiKey === undefined) throw new Error('Set AIPA_API_KEY (a server-side secret).');
const baseUrl = process.env['AIPA_API_ORIGIN'] ?? 'https://api.powerups-ai.store';

const aipa = new AiPowerUps({ apiKey, baseUrl, retry: { attempts: 1 } });
const checks: { name: string; ok: boolean; detail: string }[] = [];
const check = (name: string, ok: boolean, detail: string) => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${detail}`);
};

const started = Date.now();

const account = await aipa.account();
check('account', account.credits.cap >= 500, `plan ${account.plan.id}, cap ${account.credits.cap}`);

const page = await aipa.execute('academic.search', { query: 'transformer attention', sort: 'cited', num: 3 });
check(
  'execute',
  page.capability === 'academic.search' && page.result_count === 3 && page.charged_credits === 0,
  `${page.search_id} ${page.result_count} results, charged ${page.charged_credits}`,
);
const firstIds = new Set(page.results.map((r) => r.record_id));

const more = await aipa.followUp({ search_id: page.search_id, action: 'more' });
check(
  'more',
  more.search_id === page.search_id && more.results.every((r) => !firstIds.has(r.record_id)),
  `${more.result_count} new records on the same search`,
);

const first = page.results[0];
if (first === undefined) throw new Error('no record to open');
const detail1 = await aipa.followUp({ record_id: first.record_id, action: 'details' });
const detail2 = await aipa.followUp({ record_id: first.record_id, action: 'details' });
check(
  'details cached',
  detail1.charged_credits === 0 && detail2.cached === true && detail2.charged_credits === 0,
  `first charged ${detail1.charged_credits}, second cached=${String(detail2.cached)}`,
);

try {
  await aipa.execute('academic.search', { query: 'x', bogus: true } as never);
  check('unknown key', false, 'accepted');
} catch (error) {
  const violation = error instanceof AipaError ? error.violations?.[0]?.path : undefined;
  check('unknown key', error instanceof AipaError && error.status === 400 && violation === '/bogus', `violation path ${violation}`);
}

try {
  await aipa.followUp({ search_id: page.search_id, action: 'nope' } as never);
  check('unknown action', false, 'accepted');
} catch (error) {
  check('unknown action', error instanceof AipaError && error.status === 400 && error.code === 'invalid_request', 'invalid action rejected');
}

const elapsed = Date.now() - started;
check('budget', elapsed < 60_000, `${elapsed} ms, 7 requests`);

if (checks.some((c) => !c.ok)) process.exit(1);

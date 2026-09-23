/**
 * Compile-time checks, run by `npm run typecheck` (this file is under `include`). Each
 * `@ts-expect-error` line must fail to compile; if it starts compiling, tsc reports the unused
 * directive and the check fails.
 */
import {
  AiPowerUps,
  type CapabilityId,
  type CapabilityParams,
  type OwnedDetails,
  type RecordOf,
} from '../src/index.js';

const aipa = new AiPowerUps({ apiKey: 'apa_live_x' });

// The `{id}` placeholder of the generic operation is not a capability id.
const notAnId: '{id}' extends CapabilityId ? true : false = false;
void notAnId;

// @ts-expect-error the generic placeholder is rejected
void aipa.execute('{id}', { query: 'x' });

// @ts-expect-error unknown capability ids are rejected
void aipa.execute('web.nope', { query: 'x' });

// @ts-expect-error hotels params on a web search are rejected
void aipa.execute('web.search', { destination: 'Lisbon' });

// @ts-expect-error unknown keys are rejected (request bodies are closed)
void aipa.execute('web.search', { query: 'x', bogus: true });

// @ts-expect-error required fields must be present
void aipa.execute('hotels.search', { destination: 'Lisbon' });

// Defaulted optional fields stay optional; literal unions are enforced.
void aipa.execute('academic.search', { query: 'x' });
void aipa.execute('academic.search', { query: 'x', sort: 'cited' });
// @ts-expect-error not a member of the sort union
void aipa.execute('academic.search', { query: 'x', sort: 'newest' });

const hotels: CapabilityParams<'hotels.search'> = {
  destination: 'Lisbon',
  check_in: '2026-10-09',
  check_out: '2026-10-11',
};
void hotels;

// Follow-up return types follow the id that was passed.
const searchEnvelope = aipa.followUp({ search_id: 'srch_x', action: 'more' });
const recordEnvelope = aipa.followUp({ record_id: 'rec_x', action: 'details' });
type IsExecute = Awaited<typeof searchEnvelope> extends { search_id: string } ? true : false;
type IsRecord = Awaited<typeof recordEnvelope> extends { detail: unknown } ? true : false;
const checks: [IsExecute, IsRecord] = [true, true];
void checks;

// Documented record keys are typed per capability (optional), extra keys stay allowed.
const hotel: RecordOf<'hotels.search'> = { record_id: 'rec_x', title: 't', price_per_night: 120 };
const nightly: number | undefined = hotel.price_per_night;
void nightly;
// @ts-expect-error a documented key keeps its documented type
const wrong: RecordOf<'hotels.search'> = { record_id: 'rec_x', title: 't', price_per_night: 'cheap' };
void wrong;
async function typedExecute() {
  const page = await aipa.execute('weather.forecast', { location: 'Lisbon' });
  const daily: Record<string, unknown>[] | undefined = page.results[0]?.daily;
  void daily;
}
void typedExecute;

// Owned detail payloads are typed per capability and action.
const transcript: OwnedDetails['youtube.search']['transcript'] = {
  language: 'en',
  available_languages: ['en'],
  segments: 1,
  timestamps: [{ start: 0, text: 'hi' }],
};
void transcript;
const badTranscript: OwnedDetails['youtube.search']['transcript'] = {
  language: 'en',
  available_languages: [],
  segments: 0,
  // @ts-expect-error timestamps entries need start and text
  timestamps: [{ duration: 1 }],
};
void badTranscript;

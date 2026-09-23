/**
 * @ai-power-ups/api: a thin typed client for the AI Power Ups REST API.
 *
 * Types come from the public OpenAPI document (`src/generated/openapi.d.ts`, generated with
 * openapi-typescript from https://api.powerups-ai.store/v1/openapi.public.json). This file adds
 * only what a deterministic application needs on top of `openapi-fetch`:
 *
 * - `execute(id, params)` typed by capability id.
 * - `followUp(...)` whose return type follows `search_id` (execute envelope) or `record_id`.
 * - `pages(...)`: an async iterator over `more` that stops on `has_more: false`, tolerates empty
 *   pages, bounds the page count and never issues concurrent calls for one client.
 * - `AipaError` carrying code, status, retryable, requestId, violations and retryAfterSeconds.
 * - A conservative retry policy (see `shouldRetry`): the API has no idempotency key, `more`,
 *   `update` and execute mutate state and are billed, so they are never repeated automatically.
 *
 * Docs: https://powerups-ai.store/docs
 */
import createClient, { type Client } from 'openapi-fetch';

import type { components, paths } from './generated/openapi.js';

export type Schemas = components['schemas'];
export type ExecuteResponse = Schemas['ExecuteResponse'];
export type RecordFollowUpResponse = Schemas['RecordFollowUpResponse'];
export type RecordSummary = Schemas['RecordSummary'];
export type ErrorEnvelope = Schemas['ErrorEnvelope'];
export type AccountResponse = Schemas['AccountResponse'];
export type CatalogResponse = Schemas['CatalogResponse'];
export type SharpenRequest = Schemas['SharpenRequest'];
export type SharpenResponse = Schemas['SharpenResponse'];

/** The generic, dynamically typed execute operation; not a capability. */
type GenericExecutePath = '/v1/capabilities/{id}/execute';

/** Every concrete execute path in the document, e.g. "/v1/capabilities/web.search/execute". */
type ExecutePath = Exclude<
  Extract<keyof paths, `/v1/capabilities/${string}/execute`>,
  GenericExecutePath
>;

/** Capability ids, derived from the concrete execute paths (never the `{id}` placeholder). */
export type CapabilityId = ExecutePath extends `/v1/capabilities/${infer Id}/execute` ? Id : never;

type PathOf<Id extends CapabilityId> = `/v1/capabilities/${Id}/execute`;

type RequestBodyOf<P extends keyof paths> = paths[P] extends {
  post: { requestBody: { content: { 'application/json': infer B } } };
}
  ? B
  : never;

/** Request body type of a capability, e.g. `CapabilityParams<'hotels.search'>`. */
export type CapabilityParams<Id extends CapabilityId> = RequestBodyOf<PathOf<Id>>;

type ResponseBodyOf<P extends keyof paths> = paths[P] extends {
  post: { responses: { 200: { content: { 'application/json': infer R } } } };
}
  ? R
  : never;

type ExecuteResponses = { [Id in CapabilityId]: ResponseBodyOf<PathOf<Id>> };

/**
 * Execute envelope of a capability with its documented record keys typed (all optional, extra
 * keys allowed), e.g. `ExecuteResponseOf<'hotels.search'>['results'][number]['price_per_night']`.
 */
export type ExecuteResponseOf<Id extends CapabilityId> = ExecuteResponses[Id];

type ExecuteRecords = {
  [Id in CapabilityId]: ExecuteResponses[Id] extends { results: (infer R)[] } ? R : never;
};

/** A result record of a capability: the base keys plus its documented tier. */
export type RecordOf<Id extends CapabilityId> = ExecuteRecords[Id];

/**
 * Owned record-detail payloads (documented tier): the `detail` of a record action whose
 * shape our code builds in full. The wire type stays `unknown`; narrow with these.
 */
export type OwnedDetails = {
  'navigation.route': { details: Schemas['NavigationRouteDetailsDetail'] };
  'youtube.search': {
    details: Schemas['YoutubeSearchDetailsDetail'];
    transcript: Schemas['YoutubeSearchTranscriptDetail'];
  };
  'flights.search': { details: Schemas['FlightsSearchDetailsDetail'] };
  'companies.financials': {
    details: Schemas['CompaniesFinancialsDetailsDetail'];
    financials: Schemas['CompaniesFinancialsFinancialsDetail'];
    revenue_breakdown: Schemas['CompaniesFinancialsRevenueBreakdownDetail'];
  };
  'legal.read': { details: Schemas['LegalReadDetailsDetail'] };
};

export type FollowUpSearchInput = {
  search_id: string;
  action: 'more' | 'update';
  params?: Record<string, unknown>;
};
export type FollowUpRecordInput = {
  record_id: string;
  action: string;
  params?: Record<string, unknown>;
};
export type FollowUpInput = FollowUpSearchInput | FollowUpRecordInput;

/**
 * What a call does on the server, which decides whether a repeat is safe:
 * - `read`: GET, no state, free.
 * - `record`: a record action; a completed first call is cached, so a repeat is free.
 * - `search`: `more` / `update`; a completed call advanced or replaced the session and was billed.
 * - `execute`: a new session, billed.
 * - `sharpen`: billed, no state.
 */
export type CallKind = 'read' | 'record' | 'search' | 'execute' | 'sharpen';

export interface RetryPolicy {
  /** Attempts including the first. Default 3. */
  attempts?: number;
  /** Fallback delay when the server sends no Retry-After. Default 1000 ms. */
  baseDelayMs?: number;
  /**
   * Opt in to repeating execute and `more`/`update` after a `429 rate_limited`. Off by default:
   * the API cannot promise that a 429 (or a provider failure) left the session unchanged and
   * unbilled in every case, so a repeat may advance a page or bill again. Turn this on only when
   * your own ledger can absorb a duplicate; see https://powerups-ai.store/docs/concepts/errors.
   */
  mutating?: boolean;
}

export interface AiPowerUpsOptions {
  apiKey: string;
  /** Default https://api.powerups-ai.store */
  baseUrl?: string;
  fetch?: typeof fetch;
  retry?: RetryPolicy;
}

export class AipaError extends Error {
  /** An API error code, or `transport` when no response envelope was received. */
  readonly code: ErrorEnvelope['error']['code'] | 'transport';
  /** HTTP status, or 0 when no response was received. */
  readonly status: number;
  readonly retryable: boolean;
  readonly requestId: string | undefined;
  readonly hint: string | undefined;
  readonly violations: ErrorEnvelope['error']['violations'];
  readonly retryAfterSeconds: number | undefined;

  constructor(
    status: number,
    envelope: ErrorEnvelope | undefined,
    headers?: Headers,
    cause?: unknown,
  ) {
    const error = envelope?.error;
    super(
      error ? `${status} ${error.code}: ${error.message}` : `No response (${String(cause)})`,
      cause === undefined ? undefined : { cause },
    );
    this.name = 'AipaError';
    this.code = error?.code ?? 'transport';
    this.status = status;
    this.retryable = error?.retryable ?? false;
    this.requestId = error?.requestId;
    this.hint = error?.hint;
    this.violations = error?.violations;
    const retryAfter = headers?.get('retry-after');
    const parsed = retryAfter === null || retryAfter === undefined ? Number.NaN : Number(retryAfter);
    this.retryAfterSeconds = Number.isFinite(parsed) ? parsed : undefined;
  }
}

/**
 * Whether a failed call may be repeated automatically. Checked against the API's handler and
 * metering code (https://powerups-ai.store/docs/concepts/errors#retries), which does not make
 * "the server did nothing" a guarantee for any error on a mutating call: a provider timeout can
 * race with session persistence, and one variant of `429 rate_limited` is produced after the
 * provider work ran. Therefore:
 *
 * - `read` (GET account/catalog): repeat on `rate_limited`, provider failures and transport
 *   errors. Nothing to lose.
 * - `record`: a completed record action is cached, so a repeat is normally served free; a
 *   failed one charged 0. Repeat on `rate_limited`, provider failures and transport errors.
 *   Not a promise that every repeat is free.
 * - `search` (`more`/`update`) and `execute`: never repeated automatically. With
 *   `retry.mutating` the caller opts in to repeating `rate_limited` only.
 * - `sharpen`: never repeated automatically (billed, no state to re-check).
 * - Anything else (validation, auth, credits, unknown ids): never.
 */
export const shouldRetry = (
  error: unknown,
  kind: CallKind,
  policy: Pick<Required<RetryPolicy>, 'mutating'>,
): boolean => {
  if (!(error instanceof AipaError)) return false;
  const providerFailure =
    error.code === 'provider_timeout' || error.code === 'provider_error' || error.code === 'transport';
  switch (kind) {
    case 'read':
    case 'record':
      return error.code === 'rate_limited' || providerFailure;
    case 'search':
    case 'execute':
      return policy.mutating && error.code === 'rate_limited';
    case 'sharpen':
      return false;
  }
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class AiPowerUps {
  readonly client: Client<paths>;
  private readonly retry: Required<RetryPolicy>;
  /** Calls for one client are serialised: the API admits one metered call per account at a time. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: AiPowerUpsOptions) {
    if (!options.apiKey.startsWith('apa_')) throw new Error('AiPowerUps: apiKey must be an apa_… key.');
    this.client = createClient<paths>({
      baseUrl: options.baseUrl ?? 'https://api.powerups-ai.store',
      headers: { Authorization: `Bearer ${options.apiKey}` },
      ...(options.fetch === undefined ? {} : { fetch: options.fetch }),
    });
    this.retry = {
      attempts: options.retry?.attempts ?? 3,
      baseDelayMs: options.retry?.baseDelayMs ?? 1000,
      mutating: options.retry?.mutating ?? false,
    };
  }

  /** Runs one request after the previous one finished; repeats it only when `shouldRetry` allows. */
  private serialised<T>(run: () => Promise<T>, kind: CallKind): Promise<T> {
    const attempt = async (): Promise<T> => {
      for (let n = 1; ; n += 1) {
        try {
          return await run();
        } catch (error) {
          if (n >= this.retry.attempts || !shouldRetry(error, kind, this.retry)) throw error;
          const seconds = (error as AipaError).retryAfterSeconds ?? this.retry.baseDelayMs / 1000;
          await sleep(seconds * 1000 * n);
        }
      }
    };
    const next = this.queue.then(attempt, attempt);
    this.queue = next.catch(() => undefined);
    return next;
  }

  private static async request<T>(
    call: () => Promise<{ data?: T; error?: unknown; response: Response }>,
  ): Promise<T> {
    let result: { data?: T; error?: unknown; response: Response };
    try {
      result = await call();
    } catch (cause) {
      throw new AipaError(0, undefined, undefined, cause);
    }
    if (result.error !== undefined || result.data === undefined) {
      const envelope = result.error as ErrorEnvelope | undefined;
      throw new AipaError(result.response.status, envelope, result.response.headers);
    }
    return result.data;
  }

  /** `POST /v1/capabilities/{id}/execute` with a body typed for that capability. */
  execute<Id extends CapabilityId>(
    id: Id,
    params: CapabilityParams<Id>,
  ): Promise<ExecuteResponseOf<Id>> {
    const path = `/v1/capabilities/${id}/execute` as PathOf<Id>;
    // The concrete paths share one runtime route; openapi-fetch types each path separately.
    const post = this.client.POST as unknown as (
      path: string,
      init: { body: unknown },
    ) => Promise<{ data?: ExecuteResponseOf<Id>; error?: unknown; response: Response }>;
    return this.serialised(() => AiPowerUps.request(() => post(path, { body: params })), 'execute');
  }

  /** `POST /v1/follow-up`; the return type follows the id you pass. */
  followUp(input: FollowUpSearchInput): Promise<ExecuteResponse>;
  followUp(input: FollowUpRecordInput): Promise<RecordFollowUpResponse>;
  followUp(input: FollowUpInput): Promise<ExecuteResponse | RecordFollowUpResponse> {
    const kind: CallKind = 'search_id' in input ? 'search' : 'record';
    return this.serialised(
      () => AiPowerUps.request(() => this.client.POST('/v1/follow-up', { body: input })),
      kind,
    );
  }

  /**
   * Executes, then follows `more` while `has_more` is true, yielding every record. Bounded by
   * `maxPages` (default 10); empty pages are tolerated; calls are sequential.
   */
  async *pages<Id extends CapabilityId>(
    id: Id,
    params: CapabilityParams<Id>,
    options: { maxPages?: number } = {},
  ): AsyncGenerator<RecordOf<Id>, ExecuteResponse, void> {
    const maxPages = options.maxPages ?? 10;
    let page = (await this.execute(id, params)) as unknown as ExecuteResponse;
    for (let n = 1; ; n += 1) {
      for (const record of page.results) yield record as RecordOf<Id>;
      if (!page.has_more || n >= maxPages || !page.next.actions.includes('more')) return page;
      page = await this.followUp({ search_id: page.search_id, action: 'more' });
    }
  }

  account(): Promise<AccountResponse> {
    return this.serialised(() => AiPowerUps.request(() => this.client.GET('/v1/account')), 'read');
  }

  catalog(): Promise<CatalogResponse> {
    return this.serialised(() => AiPowerUps.request(() => this.client.GET('/v1/catalog')), 'read');
  }

  sharpen(body: SharpenRequest): Promise<SharpenResponse> {
    return this.serialised(
      () => AiPowerUps.request(() => this.client.POST('/v1/sharpen', { body })),
      'sharpen',
    );
  }
}

export default AiPowerUps;

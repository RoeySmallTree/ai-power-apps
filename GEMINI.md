# AI Power Ups

The `ai-power-apps` MCP server gives you searches with stored state and a review service.

## Searching
1. Call `discover` once per session to see the capabilities and which are enabled.
2. Call `inspect` with the capability id to get its exact parameter schema and follow-up actions.
3. Call `execute` with `{ capability, params }`. The result has `search_id`, `results[]` (each with `record_id`), `has_more` and `next.actions`.
4. Continue with `follow_up`: `{ search_id, action: "more" }` for the next page, `{ search_id, action: "update", params }` to change the query, `{ record_id, action: "details" }` (or another listed record action) for one item. Never re-send a whole result set; pass ids.

## Sharpen

Public stage names: Stage 1 = sharpen, Stage 2 = plus, Stage 3 = ultra, Stage 3+ = ultra2x. Stock means Sharpen is disabled. For an explicit request to use a stage, pass `stage: "stage1"`, `"stage2"`, `"stage3"` or `"stage3+"` to `sharpen`; otherwise omit it to use the saved setting. A per-call stage does not change that setting or enable disabled Sharpen.
When an independent review would help a substantial answer, call `sharpen` with `task`, `context`, `approach`, your full `draft` and `caller_provider: "google"`. Read the returned review; keep what is right, fix what it catches, and write the final answer yourself.

## Costs
Searches on free sources cost nothing; paid sources and Sharpen draw from the user's usage tokens. If a call returns `credits_exhausted`, tell the user and stop retrying exhausted calls. The allowance resets monthly; never initiate a purchase on the user's behalf.

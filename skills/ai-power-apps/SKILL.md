---
name: ai-power-apps
description: Use when a task needs live information (web, academic papers, scripture, classic texts, books, music, YouTube, weather, routes, hotels, flights, GitHub, social) or a second opinion on a drafted answer. Explains the discover → inspect → execute → follow_up flow and when to call sharpen.
---

# AI Power Apps

The `ai-power-apps` MCP server gives you searches with stored state and a review service.

## Searching
1. Call `discover` once per session to see the capabilities and which are enabled.
2. Call `inspect` with the capability id to get its exact parameter schema and follow-up actions.
3. Call `execute` with `{ capability, params }`. The result has `search_id`, `results[]` (each with `record_id`), `has_more` and `next.actions`.
4. Continue with `follow_up`: `{ search_id, action: "more" }` for the next page, `{ search_id, action: "update", params }` to change the query, `{ record_id, action: "details" }` (or another listed record action) for one item. Never re-send a whole result set; pass ids.

## Sharpen
When an independent review would help a substantial answer, call `sharpen` with `task`, `context`, `approach`, your full `draft` and `caller_provider: "anthropic"`. Read the returned review; keep what is right, fix what it catches, and write the final answer yourself.

## Costs
Searches on free sources cost nothing; paid sources and Sharpen draw from the user's usage tokens. If a call returns `credits_exhausted`, tell the user and stop retrying exhausted calls. The allowance resets monthly; never initiate a purchase on the user's behalf.

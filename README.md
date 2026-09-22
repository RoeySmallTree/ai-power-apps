# AI Power Ups

![AI Power Ups](https://tmfesyrmnaihvpmfvdkb.supabase.co/storage/v1/object/public/brand-assets/ai-power-ups/logo-bf0cb1a910ca.png)

Live data from the real world and a performance stage for the AI you already use — one connection, you choose what's on.

AI Powerups is an upgrade layer for the AI you already use. Connect it once and your AI can reach the live world — flights, hotels and routes; markets and companies; papers, patents, scriptures and classics; repos, recipes, weather, what people are saying — and keep working through it: more options, a closer look, the next page, a booking link.

Then choose its stage. From Stage 1 to Stage 3+, your AI answers with more behind it. Same model, beyond stock.

You pick what's on. Your AI discovers the rest — what it can do, how to ask, where to go next. New powerups arrive on the same connection. Nothing to reinstall.

Travel & places · Shopping · Markets & jobs · Real estate · News & trends · Reading & research · Music & video · Code & GitHub · Weather & environment · Food & fitness · Social · Stages — more on the way.

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

## Claude Code

```sh
claude plugin marketplace add RoeySmallTree/ai-power-apps
claude plugin install ai-power-apps@ai-power-apps
```

Restart Claude Code, open `/mcp`, select `ai-power-apps` and authenticate. Sign in to
AI Power Ups in your browser and allow the connection. This is our own marketplace;
listing in Anthropic's public directory is pending.

## Gemini CLI

Gemini CLI needs Gemini Code Assist Standard/Enterprise or a paid Gemini or Enterprise Agent Platform API key for model access. Personal Google sign-in is no longer supported; see [Google’s access notice](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/). This is separate from signing in to AI Power Ups, which does not require an AI Power Ups API key.

```sh
gemini extensions install https://github.com/RoeySmallTree/ai-power-apps
```

Restart Gemini CLI and authenticate the `ai-power-apps` MCP server with `/mcp auth`.
Complete sign-in and consent in your browser. This extension is eligible for the
Gemini CLI extensions gallery; discoverability depends on its indexing.

## Use

Ask for academic papers, local weather, a book's details, or a second opinion on a
draft. The assistant discovers capabilities, inspects inputs, executes searches,
and follows up using the returned IDs. Free accounts receive 500 usage tokens each
month. Free sources use no tokens; paid sources and Sharpen consume the allowance.

The assistant sends search parameters to AI Power Ups and its search providers.
Sharpen sends the task and draft through OpenRouter to the reviewing model provider.
Never include secrets or content you do not have permission to share. Disconnect
at any time from [Connected apps](https://powerups-ai.store/app/connections) in your AI Power Ups dashboard. Browser sign-in does not require an API key.

- [Documentation](https://powerups-ai.store/docs)
- [Privacy](https://powerups-ai.store/privacy)
- [Terms](https://powerups-ai.store/terms)
- [Plans](https://powerups-ai.store/pricing)
- Support: support@powerups-ai.store

This repository contains the plugin and extension manifests and instructions. The
hosted service is operated by Small Tree. No server code or credentials are bundled.

# AI Power Apps

Live search and Sharpen second-opinion reviews for Claude Code and Gemini CLI.
The remote MCP server offers 15 capabilities spanning web, academic papers,
scripture, classic texts, books, music, YouTube, weather, routes, hotels, flights,
GitHub and social. Searches return identifiers for paging and record follow-ups.

## Claude Code

```sh
claude plugin marketplace add RoeySmallTree/ai-power-apps
claude plugin install ai-power-apps@ai-power-apps
```

Restart Claude Code, open `/mcp`, select AI Power Apps and authenticate. Sign in to
AI Power Apps in your browser and allow the connection. This is our own marketplace;
listing in Anthropic's public directory is pending.

## Gemini CLI

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

The assistant sends search parameters to AI Power Apps and its search providers.
Sharpen sends the task and draft through OpenRouter to the reviewing model provider.
Never include secrets or content you do not have permission to share. Disconnect
at any time from the AI Power Apps dashboard's API keys page.

- [Documentation](https://powerups-ai.store/docs)
- [Privacy](https://powerups-ai.store/privacy)
- [Terms](https://powerups-ai.store/terms)
- [Plans](https://powerups-ai.store/pricing)
- Support: support@powerups-ai.store

This repository contains the plugin and extension manifests and instructions. The
hosted service is operated by Small Tree. No server code or credentials are bundled.

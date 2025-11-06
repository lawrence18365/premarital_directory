# Jina AI MCP Server Usage Instructions

## Option 1: Using the Remote Server (Recommended)

The Jina AI MCP server is already deployed and available at: `https://mcp.jina.ai/sse`

### For clients that support remote MCP servers:

Add this configuration to your client:

```json
{
  "mcpServers": {
    "jina-mcp-server": {
      "url": "https://mcp.jina.ai/sse",
      "headers": {
        "Authorization": "Bearer YOUR_JINA_API_KEY" // optional, but recommended for higher rate limits
      }
    }
  }
}
```

### For clients that don't support remote MCP servers:

You'll need to use `mcp-remote` as a local proxy:

1. First install mcp-remote:
```bash
npm install -g mcp-remote
```

2. Then configure your client:
```json
{
  "mcpServers": {
    "jina-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote", 
        "https://mcp.jina.ai/sse",
        "--header",
        "Authorization: Bearer YOUR_JINA_API_KEY"
      ]
    }
  }
}
```

## Available Tools

The server provides these tools:
- `read_url` - Extract clean content from web pages as markdown
- `capture_screenshot_url` - Capture screenshots of web pages
- `search_web` - Search the entire web for current information
- `search_arxiv` - Search academic papers on arXiv
- `search_image` - Search for images across the web
- `sort_by_relevance` - Rerank documents by relevance
- `deduplicate_strings` - Get semantically unique strings
- `deduplicate_images` - Get semantically unique images

## Getting a Jina API Key

For higher rate limits and better performance, get a free Jina API key from: https://jina.ai

## Troubleshooting

If you get stuck in a tool calling loop, make sure your AI model has sufficient context length (at least 8192 tokens recommended) to handle the full tool calling chain and thought process.

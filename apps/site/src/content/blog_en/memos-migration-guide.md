---
draft: false
title: "Memos to Kiran Brahma Notes Migration Guide"
snippet: "Migrate all your Memos notes to Kiran Brahma Notes automatically using the double MCP servers bridge."
image: {
    src: "/images/memos-migration.jpg",
    alt: "Migrate Memos to Kiran Brahma Notes"
}
publishDate: "2026-07-06 19:30"
category: "Migration"
author: "Kiran Brahma Notes Team"
tags: [memos, migration, self-hosted, mcp]
---

Since Kiran Brahma Notes natively supports AI Agent (Model Context Protocol, MCP) integration, you don't even need to export any file backups. You can directly use your AI assistant as a bridge by mounting both **Memos MCP** and **Kiran Brahma Notes MCP** servers to achieve automatic cloud-to-cloud migration.

---

### Migration Steps

#### Step 1: Install and Enable Both MCP Servers in Your AI Assistant

1. **Configure Memos MCP**:
   Set up your old Memos instance's MCP server (using the official or community-provided Memos MCP plugin) in your AI assistant (e.g., Claude Code, Cursor).

2. **Configure Kiran Brahma Notes MCP**:
   - Log in to your Kiran Brahma Notes instance, and click **Profile** -> **MCP settings**.
   - Generate an API Token, click **Copy full MCP configuration**, and configure it in your AI assistant.

Make sure your AI assistant can access and call both MCP servers simultaneously.

#### Step 2: Prompt the AI Assistant to Start the Migration

Copy and send the following prompt to the AI assistant that has access to both MCPs:

```text
You are my AI assistant. You are currently connected to both my old Memos MCP server and my new Kiran Brahma Notes MCP server.
Please help me migrate all my notes from Memos to Kiran Brahma Notes:
1. Call the Memos MCP tools to read all my old Memos (including text, creation time, tags, etc.) in batches.
2. Call the Kiran Brahma Notes MCP tools to write them into my new Kiran Brahma Notes instance.
Please report the total number of successfully imported notes when finished.
```

The AI assistant will automatically read data from Memos and write it to Kiran Brahma Notes, completing the migration through double MCP data bridging.

#### Step 3: Verify in Web Browser
Go back to your Kiran Brahma Notes web client and refresh the page to confirm that all Memos notes have been successfully recorded, and that their timestamps and tags are synchronized.

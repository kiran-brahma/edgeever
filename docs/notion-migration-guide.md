# Notion migration guide

Because Kiran Brahma Notes supports AI agents and Model Context Protocol (MCP), the cleanest way to move a Notion workspace is to let an AI assistant with access to both services do the work.

## Steps

1. **Install both MCP services in your AI assistant**
   - Configure the Notion MCP service so the assistant can read pages and databases.
   - In Kiran Brahma Notes, go to **Settings → MCP**, generate an API token, and copy the full MCP config into your AI assistant.

2. **Send the AI assistant a migration prompt**

   ```
   You are connected to my Notion MCP service and my Kiran Brahma Notes MCP service.
   Please migrate my Notion pages and databases into Kiran Brahma Notes:
   1. Read Notion pages in batches (title, content, created time, tags).
   2. Import them into Kiran Brahma Notes via its MCP write API.
   3. Report the total number of pages imported and any pages that failed to convert.
   ```

3. **Verify in the web app**
   Refresh Kiran Brahma Notes and confirm all Notion pages were imported with content and layout intact.

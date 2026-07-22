# Memos migration guide

Kiran Brahma Notes natively supports AI Agent (Model Context Protocol, MCP) access, so you can migrate without exporting data files. Connect both your old Memos MCP service and the Kiran Brahma Notes MCP service to an AI assistant and let it move the notes for you.

## Steps

1. **Install both MCP services in your AI assistant**
   - Add your old Memos MCP service (official or community plugin).
   - In Kiran Brahma Notes, go to **Settings → MCP**, generate an API token, and copy the full MCP config into your AI assistant.

2. **Send the AI assistant a migration prompt**

   ```
   You are connected to my old Memos MCP service and my new Kiran Brahma Notes MCP service.
   Please migrate all notes from Memos to Kiran Brahma Notes:
   1. Read all old Memos notes in batches (text, created time, tags).
   2. Create the corresponding notes in Kiran Brahma Notes via its MCP write API.
   3. Report the total number of notes successfully imported.
   ```

3. **Verify in the web app**
   Refresh Kiran Brahma Notes and confirm the notes, timestamps, and tags were imported.

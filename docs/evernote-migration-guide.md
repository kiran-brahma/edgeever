# Evernote migration guide

We recommend using an AI coding assistant (e.g., Claude Code, Cursor) to automate the migration. The migration script handles local image compression and empty-text preprocessing, and preserves creation/modification times and nested notebook stacks.

## Step 1: Configure the Kiran Brahma Notes MCP service

1. In the web app, go to **Settings → API & MCP**.
2. Generate a token and click **Copy full MCP config**.
3. Paste the JSON into your AI assistant and ask it to install the MCP service:

   ```
   This is my Kiran Brahma Notes MCP config. Please install it in my editor/client (Claude Code, Cursor, Cline, etc.).
   ```

## Step 2: Import from Evernote

Once the MCP service is configured, send the AI assistant this prompt:

```
Migrate my local Evernote library into my Kiran Brahma Notes instance:
1. Install `pipx install evernote-backup`.
2. Prompt me for Evernote credentials, initialize the database, and sync to `./evernote-export`.
3. Download the migration script from `https://raw.githubusercontent.com/kiran-brahma/edgeever/main/scripts/import-evernote-enex-via-mcp.mjs`.
4. Install `sharp` and `fast-xml-parser`.
5. Run the script with my URL and token (it converts images to WebP automatically).
```

## Step 3: Verify in the web app

1. Refresh Kiran Brahma Notes.
2. Check the left sidebar for the original notebook stack structure.
3. Open a few image-heavy notes to confirm images load correctly.

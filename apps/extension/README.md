# Kiran Brahma Notes Web Clipper

Chrome/Edge Manifest V3 extension for saving the current webpage or selected text to your self-hosted Kiran Brahma Notes instance.

## Current MVP

- Configure a Kiran Brahma Notes instance URL and API Token.
- Test the connection and select a default notebook.
- Click the extension action to capture the selected content, or extract the article body with Mozilla Readability when there is no selection.
- Convert the extracted article HTML into Markdown with Turndown before uploading it.
- Create a searchable note with the source URL and a `web-clip` tag.

The extension does not use a central relay service. The page content is sent directly to the Kiran Brahma Notes instance configured by the user.

## Localization

The extension uses Chrome's native `chrome.i18n` support. English is the only supported locale.

User-visible strings live in `public/_locales/en/messages.json`.

## Development

From the repository root:

```sh
bun run build:extension
```

Then open `apps/extension/dist` from `chrome://extensions` or `edge://extensions` with Developer mode enabled and choose **Load unpacked**.

The next planned step is preserving a single-file HTML archive in R2 while keeping extracted text in the note for search.

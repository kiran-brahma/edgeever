# Chrome Web Store listing

## Product details

- Name: `Kiran Brahma Notes Web Clipper`
- Primary language: `English`
- Category: `Workflow & Planning`
- Homepage: `https://notes.kiranbrahma.com/`
- Support URL: `https://notes.kiranbrahma.com/contact`
- Privacy policy: `https://notes.kiranbrahma.com/privacy`

## Localized listings

- `English`: Primary language

## Upload files

- Package: `store-assets/edgeever-web-clipper-v0.1.1.zip`
- Store icon: `public/icons/icon-128.png`
- Screenshot: `store-assets/screenshot-options-1280x800.jpg`
- Small promo tile: `store-assets/promo-small-440x280.jpg`

### English

#### Summary

Save the current webpage or selected content to your self-hosted Kiran Brahma Notes instance.

#### Detailed description

Kiran Brahma Notes Web Clipper saves the current webpage or selected content to your self-hosted Kiran Brahma Notes instance.

Key features:

- Extract article content automatically and convert it to searchable, editable Markdown.
- Prefer content selected on the page when a selection is available.
- Preserve the original title, source URL, and clipping time in the note.
- Select a default notebook and add the `web-clip` tag automatically.
- Send webpage content directly to your configured Kiran Brahma Notes instance without a developer-operated relay server.

Before using the extension, enter your Kiran Brahma Notes instance URL and API token in the extension settings. The extension reads the current tab only after you click “Save current page” and requests network access only for the Kiran Brahma Notes instance you authorize.

## Privacy practices

### Single purpose

Save the current webpage or user-selected content to the self-hosted Kiran Brahma Notes instance explicitly configured by the user.

### Permission justifications

- `activeTab`: Read the active page only after the user clicks the extension's save action.
- `scripting`: Inject the packaged content extraction script into the active page after the user initiates a capture.
- `storage`: Store the user's Kiran Brahma Notes instance URL, API token, and default notebook ID locally.
- Optional host permissions: Send API requests only to the Kiran Brahma Notes instance origin configured and approved by the user.

### Data disclosures

The extension handles authentication information, website content, and web browsing activity. These data are used only for the user-triggered clipping feature. Page content is processed locally and sent directly to the user's configured Kiran Brahma Notes instance. The developer does not receive or retain it.

- Data is not sold or transferred to third parties outside the approved use case.
- Data is not used for purposes unrelated to the extension's single purpose.
- Data is not used for creditworthiness or lending.
- No remote code is used.

## Distribution

- Visibility: Public
- Regions: All regions supported by the Chrome Web Store
- Defer publish: Off, unless a manual launch date is desired

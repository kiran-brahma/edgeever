import { describe, expect, test } from "bun:test";
import { docToMarkdown, markdownToDoc } from "@edgeever/shared";

describe("shared Markdown conversion", () => {
  test("parses adjacent headings, lists, quotes, and inline formatting into TipTap nodes", () => {
    const doc = markdownToDoc(`## 1. Organization Info
* **Company name**: Example Co., Ltd.
* **English name**: Example Co., Ltd.
## 2. Domain & Contact
* **Official website**: [Kiran Brahma Notes](https://notes.kiranbrahma.com)
> [!WARNING]
> Do not bind other accounts.`);

    expect(doc.content.map((node) => node.type)).toEqual([
      "heading",
      "bulletList",
      "heading",
      "bulletList",
      "blockquote",
    ]);

    const firstList = doc.content[1];
    const firstText = firstList.content?.[0]?.content?.[0]?.content?.[0];
    expect(firstText).toEqual({
      type: "text",
      text: "Company name",
      marks: [{ type: "bold" }],
    });

    const secondList = doc.content[3];
    const linkText = secondList.content?.[0]?.content?.[0]?.content?.[2];
    expect(linkText).toMatchObject({
      type: "text",
      text: "EdgeEver",
      marks: [{ type: "link", attrs: { href: "https://www.edgeever.org" } }],
    });
  });

  test("serializes TipTap marks and block nodes back to Markdown", () => {
    const markdown = `# Title

- **bold** and *italic*
- [link](https://example.com)

> quote

\`code\` and ~~strikethrough~~`;

    expect(docToMarkdown(markdownToDoc(markdown))).toBe(markdown);
  });

  test("preserves fenced code blocks and standalone images", () => {
    const markdown = `\`\`\`ts
const answer = 42;
\`\`\`

![Example](/api/v1/resources/res_1/blob "Title")`;

    const doc = markdownToDoc(markdown);
    expect(doc.content.map((node) => node.type)).toEqual(["codeBlock", "image"]);
    expect(docToMarkdown(doc)).toBe(markdown);
  });
});

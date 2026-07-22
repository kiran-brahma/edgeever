# Kiran Brahma Notes marketing site

This directory is the marketing site application inside the `edgeever` monorepo, located at `apps/site`.

> **Kiran Brahma Notes**: a free, open-source, self-hosted notes workspace on Cloudflare, with native AI Agent (MCP) support.
>
> Repository: [kiran-brahma/edgeever](https://github.com/kiran-brahma/edgeever)
>
> Live site: [https://notes.kiranbrahma.com](https://notes.kiranbrahma.com)

---

## Tech stack

- **Framework**: [Astro v5](https://astro.build/) (static site generation)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Content**: Astro Content Collections (Markdown guides and changelog)

## Development and build

### 1. Install dependencies

```bash
bun install
```

### 2. Start the dev server

```bash
bun run dev:site
```

### 3. Build the static site

```bash
bun run build:site
```

Output is written to `apps/site/dist/`.

### 4. Preview the build

```bash
bun run preview:site
```

## Directory structure

- `src/pages/`: main pages (home, contact, changelog).
- `src/components/`: reusable UI and section components.
- `src/content/blog/`: technical guides and release notes in Markdown.
- `public/`: static images, icons, and `robots.txt`.

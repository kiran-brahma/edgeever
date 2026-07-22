export type SiteLocale = "en-US";

export const defaultSiteLocale: SiteLocale = "en-US";
export const siteLocaleStorageKey = "edgeever.site.locale";
export const siteLocaleDataAttribute = "data-edgeever-site-locale";
export const siteTagline =
  "A private, serverless notes workspace by Kiran Brahma." as const;

export const getSiteLocale = (_pathname: string): SiteLocale => "en-US";

export const getLocalizedPath = (_locale: SiteLocale, path: string) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/en" || normalizedPath.startsWith("/en/")) {
    return normalizedPath.replace(/^\/en/, "") || "/";
  }

  return normalizedPath;
};

export const siteCopy = {
  "en-US": {
    layout: {
      defaultDescription:
        "Kiran Brahma Notes is a private, serverless notes workspace built on Cloudflare.",
      defaultTitle: `Kiran Brahma Notes - ${siteTagline}`,
      imageAlt: "Kiran Brahma Notes screenshot",
      ogLocale: "en_US",
    },
    nav: {
      homeAria: "Kiran Brahma Notes home",
      features: "Features",
      guides: "Guides",
      deploy: "Deploy",
      migration: "Migrate from Evernote",
      evernoteMigration: "Migrate from Evernote",
      memosMigration: "Migrate from Memos",
      notionMigration: "Migrate from Notion",
      advancedPlay: "AI Agent plays",
      blog: "Blog",
      contact: "Contact",
      privacy: "Privacy",
      demo: "Demo",
      language: "Language",
      languageMenu: "Change language",
      tagAll: "All",
      tagMigration: "Migration",
      tagMcp: "AI & MCP",
      tagSelfHosted: "Deployment",
    },
    hero: {
      slogan: siteTagline,
      demo: "Open app",
      agentInstall: "Deploy",
      imageAlt: "Kiran Brahma Notes product preview",
      badgeText: "",
    },
    features: {
      heading: "A personal notes workspace rebuilt for self-hosting",
      items: [
        {
          title: "No Server, Zero Maintenance",
          summary:
            "Say goodbye to server rental fees and complex system management. Kiran Brahma Notes runs entirely within Cloudflare's free tiers.",
          points: [
            "No server required: no Docker, Nginx, or SSL configuration.",
            "Free tier friendly: take advantage of Cloudflare Workers, D1, and R2.",
            "Your data lives in your own Cloudflare account.",
          ],
        },
        {
          title: "AI Agent native",
          summary:
            "Built-in REST API, OpenAPI schema, and Remote MCP endpoint let AI assistants read, create, and organize notes safely.",
          points: [
            "Generate an MCP token in the app to connect with Codex, Claude Code, and similar tools.",
            "Useful for summaries, automatic tagging, and cross-note retrieval.",
            "Agent workflows operate on your private instance.",
          ],
        },
        {
          title: "Classic three-pane workflow",
          summary:
            "Notebook tree, note list, and editor stay familiar for Evernote-style migrations.",
          points: [
            "Unlimited nested notebooks support long-lived knowledge bases.",
            "Drag notebooks to reorder or change hierarchy, and move or merge notes in batches.",
            "A rich text editor includes note version history.",
          ],
        },
        {
          title: "Open data, easier migration",
          summary:
            "Notes remain available as structured JSON, Markdown, and plain text, with native ZIP import and export.",
          points: [
            "Content lives in Cloudflare D1, based on standard SQLite.",
            "Native ZIP import and export includes Markdown, Front Matter, notebooks, attachments, and revision history.",
            "Evernote import support lowers migration cost.",
          ],
        },
        {
          title: "Multi-device sync, uncapped limits",
          summary:
            "Use Kiran Brahma Notes from desktop, phone, or tablet with no device limits.",
          points: [
            "No device limits: self-hosted API means no commercial restrictions.",
            "Open it in the browser or install it as a PWA.",
            "Offline drafts and a local sync queue keep notes safe in weak network conditions.",
          ],
        },
        {
          title: "One instance, isolated accounts",
          summary:
            "Create accounts for family or a small team while giving each person a separate private notes workspace.",
          points: [
            "The owner can create or disable member accounts and reset passwords.",
            "Each member has isolated notebooks, notes, attachments, Trash, and import/export data.",
            "MCP tokens are isolated by workspace.",
          ],
        },
      ],
    },
    guides: {
      eyebrow: "Guides",
      heading: "Deploy, migrate, and put AI agents to work",
      description:
        "The fastest paths in: deploy your own instance, move an existing Evernote archive, then connect MCP-powered AI workflows.",
      items: [
        {
          title: "Three ways to deploy",
          summary:
            "Choose Cloudflare one-click, an AI Agent, or manual deployment—all three use the same reliable deployment pipeline.",
          href: "/blog/ai-agent-deploy-cloudflare",
          cta: "Read deployment guide",
        },
        {
          title: "Migrate from Evernote",
          summary:
            "Use MCP, evernote-backup, and the ENEX import script to migrate an old notes library into your self-hosted instance.",
          href: "/blog/evernote-migration-guide",
          cta: "Read migration guide",
        },
        {
          title: "AI Agent advanced workflows",
          summary:
            "Turn real notes into knowledge maps, tag cleanup plans, and higher-level personal knowledge workflows through MCP.",
          href: "/guides/advanced-play",
          cta: "Explore workflows",
        },
      ],
    },
  },
} as const;

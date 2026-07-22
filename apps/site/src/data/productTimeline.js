export const productTimeline = [
  {
    date: "2026-07-03",
    title: "Configurable note shortcuts",
    summary: "Added configurable note shortcuts so frequent notes and actions are easier to pin and reuse.",
    commits: ["55d8e04"],
    highlights: ["Configurable shortcuts", "Continued refining high-frequency note workflows"],
  },
  {
    date: "2026-07-02",
    title: "README, demo environment and long-term sessions",
    summary:
      "Updated product guides, demo data and sign-in experience; default web session TTL extended to 5 years to reduce repeated sign-ins for self-hosted users.",
    commits: ["7369d94", "2c82e82", "746f3d9", "f937376", "21c1639"],
    highlights: ["Product README update", "Demo reset and prefilled sign-in", "Demo image seed resources", "5-year session TTL"],
  },
  {
    date: "2026-07-01",
    title: "Agent and editing enhancements",
    summary:
      "Expanded MCP capabilities with a memo listing tool; split settings page components for clearer config copying; improved editor toolbar, code blocks and new-note responsiveness.",
    commits: ["dca1762", "8cd7ba2", "74b623c", "77122d6", "58f8453"],
    highlights: ["MCP memo listing tool", "AI agent deployment flow improvements", "Settings page component split", "Editor toolbar tooltip", "Multi-line code block selection fix"],
  },
  {
    date: "2026-06-30",
    title: "Evernote migration, MCP config and PWA stability",
    summary:
      "Migration and agent integration day: added sharp local image compression and empty-text preprocessing to the Evernote ENEX importer, improved MCP token config copying, and added PWA update prompts and resume refresh.",
    commits: ["d11171c", "631a3df", "02906eb", "7dd12e9", "e9136b2"],
    highlights: ["Evernote importer local image compression", "ENEX empty-text preprocessing", "MCP config copying", "Asset panel grid / search / drag upload", "PWA resume refresh"],
  },
  {
    date: "2026-06-29",
    title: "Mobile notes and Evernote migration",
    summary:
      "Polished mobile note reading, attachment upload, formatting toolbar and new-note focus; introduced Evernote import flow and migration guide.",
    commits: ["69abf9b", "779784d", "64b254b", "16dce39", "a08f3d5"],
    highlights: ["Mobile note view modes", "Mobile attachment upload", "Mobile formatting toolbar", "Evernote import flow", "Migration guide entry"],
  },
  {
    date: "2026-06-28",
    title: "Workspace refactor and brand visual unification",
    summary:
      "Refactored the web app from a monolithic structure into modular components; settings and assets became workspace views. Introduced shadcn/ui, EdgeEver brand color variables, mobile interactions and performance code-splitting.",
    commits: ["b201d7d", "c0868dc", "e7ab278", "fa139b9", "2a0978a"],
    highlights: ["App.tsx modularization", "Settings / assets full-page workspace", "EdgeEver brand variables", "Initial bundle split", "Notebook sort options"],
  },
  {
    date: "2026-06-27",
    title: "Offline sync, MCP/CLI docs and three-pane interactions",
    summary:
      "Added offline sync and agent docs, strengthened MCP/CLI workflows; refined Evernote-style note list interactions, selection, pinning and mobile notebook navigation.",
    commits: ["377b7b9", "8ab55b7", "a40d85b", "a9478ea", "202e795"],
    highlights: ["Offline sync", "MCP and CLI usage docs", "Mobile notebook navigation", "Note selection and pinning", "Green theme color tuning"],
  },
  {
    date: "2026-06-26",
    title: "Cloudflare self-hosting foundation",
    summary:
      "Multi-instance deployment, password login, Worker-compatible password hashes, PWA, search, trash, revision history, agent tokens and MCP CLI access took shape in this phase.",
    commits: ["da8ac14", "e2f9b66", "49646ca", "f7a144b", "fd2250b"],
    highlights: ["Multi-instance Cloudflare deployment", "Password login", "PWA support", "Auto-save / trash / search", "Agent tokens and MCP CLI"],
  },
];

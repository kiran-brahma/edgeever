# Agent rules and constraints for `apps/site`

When AI agents (Antigravity, Claude Code, Cursor, etc.) collaborate on this directory, follow these rules.

## Site content rules

- **Source of truth is the monorepo root**: all feature descriptions, deployment guides, migration guides, and release notes shown on the site must be derived from the actual code and docs in the repository root (`README.md`, `docs/*`, component/API implementations).
- **Check before editing**: before modifying site content, blogs, or feature lists, read the latest root-level docs and code to avoid drift.
- **No fictional or placeholder content**: do not write generic placeholder text or anything unrelated to the actual `edgeever` project. All technical details must be verifiable.
- **Keep docs in sync**: if root-level docs such as `docs/agent-deploy-cloudflare.md` or `docs/evernote-migration-guide.md` change, update the corresponding site pages and blog posts.

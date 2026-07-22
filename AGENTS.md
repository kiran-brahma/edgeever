# AGENTS.md

This file governs and guides AI agents and collaborators working on this project. Unless the user gives an explicit higher-priority instruction, follow the rules below.

## Project background and tech stack

For project background, positioning, deployment information, and tech stack, refer to `README.md` first.

## Chinese/English documentation synchronization

When editing Chinese documentation, update the corresponding English documentation in sync so the content stays consistent.

## Git branch rules

Creating new Git branches is prohibited. All changes, commits, and pushes must be made directly on the `main` branch.

## GitHub Issue and Release rules

Formal releases follow Semantic Versioning. Tags and Release titles use the `vX.Y.Z` format. Before releasing, check remote tags and actual GitHub Releases; isolated tags must not serve as release baselines, and every formal tag should ultimately have a matching Release.

A Release is based on the previous formal Release. Audit the full commit range and summarize all user-perceptible changes. Release notes must be in English. Tags must point to verified commits on `main`. Releases are non-draft and non-prerelease by default. Feature or fix releases must reference an Issue with the corresponding label; after release, link back to it and close it. Body structure:

```md
## Major updates

- Explain the change and its impact to users.

Related issue: #<issue-number>

## Verification

- List the actual tests, type checks, and build results completed.
```

Do not publish a formal Release if verification fails.

Every formal Release must include an installable Android APK. APK file names must use `edgeever-android-vX.Y.Z-<ABI>.apk`, for example `edgeever-android-v0.4.14-arm64-v8a.apk`. GitHub APK builds only `arm64-v8a` by default; extra ABIs are provided only when there is an explicit compatibility requirement, while the Play AAB retains all architectures. If the full change range affects mobile code, its shared dependencies, native configuration, or APK build, rebuild the production-signed APK from the release commit; otherwise the most recent compatible APK may be reused, and the source Release must be noted in the release body. Before release, verify the APK version, signature, SHA-256, and download availability.

## Cloudflare automatic deployment rules

When the user asks to install and deploy this project to Cloudflare from a GitHub project link, read `docs/agent-deploy-cloudflare.md` in full and follow it exactly. That document is the only operational specification for this deployment flow; do not repeat deployment commands, password configuration, or Workers Builds steps in this file.

## Local startup rules

- Use `bun run dev` by default to start the full local environment (local D1/R2 with the fixed demo seed). It must not connect to the remote instance configured in `.env.local`.
- Only when the user explicitly specifies a remote instance and asks to connect, use `EDGE_EVER_INSTANCE=<instance-name> bun run dev:remote`; private configuration is read from `.env.local`, and instance names must not be hard-coded.
- Only use `bun run dev:web` when the user explicitly asks to start only the frontend.

## Component reuse and no-reinventing-the-wheel rules

UI functionality should reuse existing UI components such as `shadcn/ui` whenever possible. When implementing other features, prefer mature, stable open-source components or libraries. Never build a custom implementation from scratch without strong justification.

To keep the code maintainable, when a page or feature module develops complex structure, repeated layouts, or potential reuse scenarios, extract it into an independent component as appropriate, keeping the page entry focused on composition and data flow.

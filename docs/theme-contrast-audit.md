# Theme & contrast audit — dark/light mode

## Scope

Reviewed the CSS surface of the web/PWA app (`apps/web/src/styles/*`) and the
components that control theme switching, looking for:

- hardcoded foreground/background colors that break in one theme,
- missing dark-mode overrides,
- duplicated contrast logic,
- missing user controls to switch themes.

## Findings

### 1. Mobile editor body text was unreadable in dark mode (critical)

**File:** `apps/web/src/styles/mobile-markdown-editor.css`

`.edgeever-mobile-tiptap-content` declared `color: #020617;` (near-black) but had
**no** `:root.dark` override. The dark background was `#0f172a`, so body text
was effectively invisible.

Same file also missed dark overrides for:
- blockquote text (`color: #475569`),
- horizontal rule color (`border-top-color: #e2e8f0`),
- placeholder text,
- notebook-sheet header text/button,
- notebook option text,
- fallback panel.

### 2. Mobile editor page had no theme toggle (critical)

The standalone mobile editor (`mobile-edit.html` / `MobileStandaloneTiptapEditor`)
only called `initializeTheme()` once. It did not react to live system theme
changes and provided **no UI** to switch modes. This is the page the PWA opens
when editing a note on phones, so users could not correct the broken contrast.

### 3. Main-app `ThemeToggle` was hidden on mobile

`ThemeToggle.tsx` used `hidden ... lg:inline-flex`, so it never appeared on
phone-sized viewports even when it was mounted (e.g. in `EditorPane`).

### 4. Editor colors were defined twice (light + dark)

Both `globals.css` and `mobile-markdown-editor.css` maintained parallel rule sets:
light colors in the base selector and dark colors in a `:root.dark` override.
This is hard to keep in sync and is exactly what produced the missing overrides
above.

### 5. shadcn/ui primitives rely on a global `!important` override block

`apps/web/src/components/ui/*.tsx` hardcodes Tailwind utility colors such as
`bg-white`, `text-slate-950`, `border-slate-200`. `globals.css` contains a long
`:root.dark [class~="bg-white"] { ... !important }` compatibility sheet that
flips these colors in dark mode. This is brittle: every new shade or component
must be added to the override list, and it does not help the mobile editor
entry point because that entry does not load `globals.css`.

### 6. `tiptap-ime-test.css` is not theme-aware

The IME test page (`apps/web/src/tiptap-ime-test.tsx`) hardcodes light colors
and has no dark mode. It is a developer test page, not user-facing, so it is
out of scope for this fix but is noted for future cleanup.

## Changes made

### Centralized semantic tokens

Created `apps/web/src/styles/theme.css` and moved all theme variables there:

- existing HSL primitives (`--background`, `--foreground`, `--card`, `--primary`,
  `--secondary`, `--muted`, `--destructive`, `--border`, `--ring`, etc.),
- brand-green and slate RGB scales used with alpha,
- new editor semantic tokens (`--editor-bg`, `--editor-fg`, `--editor-muted`,
  `--editor-placeholder`, `--editor-border`, `--editor-surface`, `--editor-code-*`,
  `--editor-blockquote-*`, `--editor-table-*`, `--editor-search-match-*`).

Light and dark values for each token live next to each other in `:root` and
`:root.dark`, so a single CSS rule can handle both themes.

### Refactored main app styles

`apps/web/src/styles/globals.css` now:

- imports `theme.css`,
- uses `hsl(var(--editor-fg))`, `hsl(var(--editor-code-bg))`, etc. for
  `.ProseMirror`, `.markdown-content`, and table styles,
- removed many redundant `:root.dark .ProseMirror ...` and
  `:root.dark .markdown-content ...` overrides because the variables switch
  automatically,
- kept the legacy `!important` shadcn override block with a comment explaining
  that new components should prefer semantic tokens instead.

### Refactored mobile editor styles

`apps/web/src/styles/mobile-markdown-editor.css` now:

- imports `theme.css`,
- uses semantic tokens for shell, header, toolbar, sheets, and the Tiptap
  editor content,
- removes the scattered `:root.dark` overrides (the tokens now cover both
  themes),
- fixes the previously missing dark-mode text color for editor content,
  blockquotes, horizontal rules, placeholders, and sheet/notebook chrome.

### Added theme toggle to mobile editor header

- `apps/web/src/mobile-edit.tsx` now wraps `MobileStandaloneTiptapEditor` in
  `ThemeProvider`, so `useTheme` works and system-theme changes are listened to.
- `apps/web/src/components/MobileStandaloneEditorParts.tsx` adds a sun/moon
  toggle button to `MobileEditorHeader`. Toggling writes the preference to the
  same `localStorage` key the main app uses, so the choice is shared.
- Added `.mobile-editor-theme-toggle` styling in
  `mobile-markdown-editor.css`.

### Made main-app `ThemeToggle` visible by default

`apps/web/src/components/ThemeToggle.tsx`:

- removed the `hidden lg:inline-flex` default so it appears on all viewports,
- switched to semantic Tailwind classes (`text-muted-foreground`,
  `hover:bg-muted`, `hover:text-foreground`, `focus-visible:ring-ring`) so it
  no longer depends on the shadcn override block for correct contrast.

## Verification

- `bun run typecheck` passes.
- `bun run build:web` passes.
- Inspected generated CSS bundles:
  - `apps/web/dist/assets/app-*.css`: `.ProseMirror` uses
    `hsl(var(--editor-fg))` and the dark override block is intact for shadcn.
  - `apps/web/dist/assets/mobile-edit-*.css`:
    `.edgeever-mobile-tiptap-content` uses `hsl(var(--editor-fg))` and both
    light and dark variable sets are present.

## Remaining recommendations

1. **Migrate shadcn/ui primitives to semantic tokens.** Instead of `bg-white`,
   `text-slate-950`, use `bg-card`, `text-card-foreground`, `border-border`,
   etc. Once that is done the `!important` override block in `globals.css`
   can be removed.
2. **Theme-aware `tiptap-ime-test.css`.** If the IME test page is used on
   devices with dark mode, add the same variable import.
3. **Audit remaining hardcoded hex colors.** A few decorative colors (image
   controls shadow, selected cell overlay, mermaid error red) still use fixed
   hex values. They were left because they already have acceptable contrast in
   both themes, but they should eventually be tokenized for consistency.

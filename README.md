# String020 Personal Portal

Astro personal website with a portal-style dashboard, Markdown blog posts, and a private direct-editing workflow.

Target GitHub Pages repository:

```txt
String020.github.io
```

## Run Locally

```bash
pnpm install
pnpm dev
```

Then open the URL printed by Astro, usually:

```text
http://localhost:4321
```

## Build

```bash
pnpm build
pnpm preview
```

## Structure

- `src/data/site.ts`: editable website text and links.
- `src/data/portal-content.json`: published editable navigation, blocks, and rich pages.
- `src/content/blog/`: Markdown blog posts.
- `src/pages/index.astro`: main portal page.
- `src/pages/admin.astro`: hidden administrator sign-in entry.
- `src/pages/blog/`: blog archive and article routes.
- `public/assets/portal-editor.js`: direct-on-page editor.
- The private `admin-api/` source tree (kept outside the public Git history): Google Cloud API for login, drafts, uploads, publishing, and releases.
- `src/styles/global.css`: visual styling and responsive layout.
- `public/assets/handwriting-bg.jpg`: background image served by Astro.
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow.

See `MAINTAIN.md` for content behavior and `GOOGLE_CLOUD_SETUP.md` for the private cloud administrator service.

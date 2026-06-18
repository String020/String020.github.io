# String020 Personal Portal

Astro personal website with a portal-style dashboard, sliding panels, and Markdown blog posts.

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
- `src/content/blog/`: Markdown blog posts.
- `src/pages/index.astro`: main portal page.
- `src/pages/blog/`: blog archive and article routes.
- `src/styles/global.css`: visual styling and responsive layout.
- `public/assets/handwriting-bg.jpg`: background image served by Astro.
- `.github/workflows/deploy.yml`: GitHub Pages deployment workflow.

See `MAINTAIN.md` for editing and publishing notes.

# Personal Site Maintenance

## Direct editor

After the Google Cloud administrator service is configured, open `/admin/` and sign in with the GitHub account `String020`. The sliders icon then appears in the header and opens direct edit mode.

Version 1 behavior:

- `STRING` is permanently protected.
- `BLOG` and its Markdown articles are protected for now.
- `ARCHIVES`, `MY`, `ABOUT`, and newly created navigation pages can be renamed, reordered, or permanently deleted.
- A navigation page contains half-width or full-width information blocks and page blocks.
- Page blocks can open a rich page with paragraphs, H2/H3 headings, images, lists, links, quotes, dividers, and code.
- Deleting navigation shows affected blocks, pages, images, and URLs, then requires typing its name.
- Changes save as a private draft. `Publish` creates a GitHub commit; the public site changes only after the Pages build succeeds.
- `Releases` shows the latest 20 content commits. Restoring creates a new commit instead of rewriting history.

Published editor content is stored in `src/data/portal-content.json`. Do not hand-edit that file while a cloud draft is open on another device.

## Blog posts

Blog management remains file-based in version 1. Create a Markdown file under `src/content/blog/`:

```md
---
title: "My Post Title"
description: "One short summary."
date: "2026-06-18"
tags: ["study", "project"]
category: "Study"
pinned: false
draft: false
---

Write the post here.
```

The file name becomes `/blog/<file-name>/`. Set `draft: true` to hide it.

## Files that remain code-managed

- `src/data/site.ts`: profile, dashboard, blog panel, search, and lab text.
- `src/content/blog/`: Markdown blog articles.
- `src/styles/global.css`: visual design and editor styling.
- `public/assets/portal-editor.js`: direct editor behavior.
- `admin-api/`: private cloud administrator service.

## Local development

```powershell
pnpm install
pnpm dev
```

On localhost, `/admin/` offers `Open local editor`. Local drafts remain in that browser and cannot publish. This mode is only for interface development.

Validate both applications:

```powershell
pnpm build
pnpm --dir admin-api build
```

## Publishing and cloud setup

GitHub Pages deployment remains in `.github/workflows/deploy.yml`. The Google Cloud administrator API publishes only `src/data/portal-content.json` through a repository-scoped GitHub App.

Follow `GOOGLE_CLOUD_SETUP.md` before enabling cloud sign-in. Never place GitHub App credentials, private keys, session secrets, or Google credentials in GitHub-tracked files.

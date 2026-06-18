# Personal Site Maintenance

## Change Website Text

Edit this file:

```txt
src/data/site.ts
```

Most visible text lives there:

- brand name and initials
- profile name, summary, quick links
- dashboard stats
- project cards
- skill cards
- note cards
- contact links
- top navigation labels

The visual style lives here:

```txt
src/styles/global.css
```

## Add A Blog Post

Create a new Markdown file here:

```txt
src/content/blog/my-post-name.md
```

Use this format:

```md
---
title: "My Post Title"
description: "One short summary."
date: "2026-06-18"
tags: ["study", "project"]
---

Write your post here.
```

The file name becomes the URL:

```txt
/blog/my-post-name/
```

To hide a draft from the site:

```md
draft: true
```

## Add Or Remove A Panel

For small changes, edit `src/data/site.ts`.

For a new top navigation page, edit:

```txt
src/pages/index.astro
```

The slide interaction now counts pages automatically, so you do not need to edit CSS percentages.

## Local Commands

```bash
pnpm install
pnpm dev
pnpm build
```

## GitHub Pages

This project already includes:

```txt
.github/workflows/deploy.yml
```

After pushing to GitHub:

1. Open the repository on GitHub.
2. Go to Settings.
3. Go to Pages.
4. Set Source to GitHub Actions.
5. Push to the `main` branch.

The workflow handles normal project repositories and `<username>.github.io` repositories automatically.

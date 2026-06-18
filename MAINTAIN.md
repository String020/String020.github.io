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
- top navigation labels
- portal panels such as Blog, Archive, My, Network, Build, and System
- generated feature pages such as `anime`, `diary`, `friends`, `projects`, and `skills`
- project cards, skill cards, side widgets, and planned system functions

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
category: "Study"
pinned: false
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

Optional fields inspired by Mizuki-style blog frontmatter:

```md
published: "2026-06-18" # alternative to date
updated: "2026-06-19"
image: "./cover.jpg"
category: "Frontend"
pinned: true
comment: false
lang: "en"
```

## Add Or Remove A Panel

For small changes, edit `src/data/site.ts`.

For a new top navigation page, edit both:

```txt
src/data/site.ts
src/pages/index.astro
```

The slide interaction now counts pages automatically, so you do not need to edit CSS percentages.

## Add Or Remove A Feature Page

Generated feature pages live in:

```txt
src/data/site.ts
```

Edit the `featurePages` array. Each item becomes a route:

```txt
slug: "anime" -> /anime/
slug: "friends" -> /friends/
```

The shared page template is:

```txt
src/pages/[section].astro
```

You usually do not need to edit it unless the page needs custom behavior.

## Current Function Map

The site is now organized like a lightweight personal blog portal:

- `BLOG`: Markdown articles from `src/content/blog`.
- `ARCHIVE`: post timeline, categories, tags, and RSS.
- `MY`: anime, diary, albums, and devices pages.
- `NETWORK`: about, friends, GitHub, email, and site links.
- `BUILD`: projects, skills, and timeline pages.
- `SYSTEM`: ready/planned features such as RSS, search, comments, music, and widgets.

The RSS feed is generated at:

```txt
/rss.xml
```

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

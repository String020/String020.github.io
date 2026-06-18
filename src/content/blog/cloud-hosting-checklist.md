---
title: "Cloud Hosting Checklist"
description: "Small notes for turning the prototype into a published personal website."
date: "2026-06-17"
tags: ["github-pages", "astro"]
---

Before publishing the site, check these items:

- Replace placeholder name and contact links.
- Decide whether the repository will be a user site or project site.
- Configure `site` and `base` in `astro.config.mjs` after the GitHub repository name is final.
- Keep `node_modules` out of GitHub.
- Commit `pnpm-lock.yaml` so GitHub Actions uses the same dependency graph.

This post is only a starter. You can delete it later.

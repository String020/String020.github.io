import { defineCollection } from "astro:content";
import { glob, type Loader } from "astro/loaders";
import { z } from "astro/zod";
import { editorPosts, resolveEditorPostBody, resolveEditorPostImage } from "./lib/portal-content";

const markdownPosts = glob({ pattern: "**/*.md", base: "./src/content/blog" });

// Posts come from Markdown files in src/content/blog and from the online editor (portal-content.json).
const blogLoader: Loader = {
  name: "blog-posts",
  async load(context) {
    await markdownPosts.load(context);
    // The content store persists between builds (CI caches it too) and the glob loader only prunes
    // file-backed entries, so drop earlier editor posts before adding the current ones.
    for (const id of context.store.keys()) {
      if (!context.store.get(id)?.filePath) context.store.delete(id);
    }
    for (const post of editorPosts) {
      if (context.store.has(post.slug)) {
        context.logger.warn(`Skipping editor post "${post.slug}": a Markdown post already uses this address.`);
        continue;
      }
      const body = resolveEditorPostBody(post);
      const data = await context.parseData({
        id: post.slug,
        data: {
          title: post.title,
          description: post.description,
          date: post.date,
          updated: post.updated || undefined,
          tags: post.tags,
          category: post.category || undefined,
          series: post.series || undefined,
          lang: post.lang || undefined,
          pinned: post.pinned,
          draft: post.draft,
          image: resolveEditorPostImage(post),
          comment: post.comment,
        },
      });
      context.store.set({
        id: post.slug,
        data,
        body,
        rendered: await context.renderMarkdown(body),
        digest: context.generateDigest({ ...post, body }),
      });
    }
  },
};

const blog = defineCollection({
  loader: blogLoader,
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    published: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().default("General"),
    series: z.string().optional(),
    lang: z.string().default("zh-CN"),
    pinned: z.boolean().default(false),
    draft: z.boolean().default(false),
    image: z.string().optional(),
    comment: z.boolean().default(true),
  }),
});

export const collections = { blog };

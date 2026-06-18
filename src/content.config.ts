import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
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

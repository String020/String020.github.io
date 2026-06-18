import type { CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export const isPublished = (post: BlogPost) => !post.data.draft;

export const sortPosts = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => {
    const pinnedDiff = Number(Boolean(b.data.pinned)) - Number(Boolean(a.data.pinned));
    if (pinnedDiff !== 0) return pinnedDiff;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });

export const sortPostsByDateOnly = (posts: BlogPost[]) =>
  [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

export const formatDate = (date: Date) => dateFormatter.format(date);

export const slugifyTaxonomy = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "general";

export const getCategory = (post: BlogPost) => post.data.category || "General";
export const getSeries = (post: BlogPost) => post.data.series?.trim() || "";

export const getAllTags = (posts: BlogPost[]) =>
  Array.from(new Set(posts.flatMap((post) => post.data.tags))).sort((a, b) => a.localeCompare(b));

export const getAllCategories = (posts: BlogPost[]) =>
  Array.from(new Set(posts.map((post) => getCategory(post)))).sort((a, b) => a.localeCompare(b));

export const getAllSeries = (posts: BlogPost[]) =>
  Array.from(new Set(posts.map((post) => getSeries(post)).filter(Boolean))).sort((a, b) => a.localeCompare(b));

export const getImageUrl = (post: BlogPost, withBase: (path?: string) => string) => {
  const image = post.data.image?.trim();
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return withBase(image);
};

const getBody = (post: BlogPost) => {
  const maybePost = post as BlogPost & { body?: string };
  return maybePost.body ?? "";
};

export const getReadingStats = (post: BlogPost) => {
  const body = getBody(post)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/<[^>]+>/g, " ");

  const latinWords = body.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) ?? [];
  const cjkChars = body.match(/[\u3400-\u9fff\uf900-\ufaff]/g) ?? [];
  const wordCount = latinWords.length + cjkChars.length;
  const minutes = Math.max(1, Math.ceil(wordCount / 220));

  return {
    wordCount,
    minutes,
    label: `${minutes} min read · ${wordCount} words`,
  };
};

export const getPostUrl = (post: BlogPost) => `/blog/${post.id}/`;

export const groupPostsByYear = (posts: BlogPost[]) =>
  posts.reduce<Record<string, BlogPost[]>>((groups, post) => {
    const year = String(post.data.date.getFullYear());
    groups[year] = groups[year] ?? [];
    groups[year].push(post);
    return groups;
  }, {});

export const getAdjacentPosts = (posts: BlogPost[], currentPost: BlogPost) => {
  const orderedPosts = sortPostsByDateOnly(posts);
  const currentIndex = orderedPosts.findIndex((post) => post.id === currentPost.id);

  return {
    previous: currentIndex >= 0 ? orderedPosts[currentIndex + 1] : undefined,
    next: currentIndex > 0 ? orderedPosts[currentIndex - 1] : undefined,
  };
};

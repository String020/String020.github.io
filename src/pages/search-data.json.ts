import { getCollection } from "astro:content";
import { getCategory, getImageUrl, getReadingStats, getSeries, isPublished, sortPosts } from "../lib/blog";

export async function GET() {
  const base = import.meta.env.BASE_URL || "/";
  const withBase = (path = "") => `${base}${path.replace(/^\/+/, "")}`;
  const posts = sortPosts((await getCollection("blog")).filter(isPublished));

  const payload = posts.map((post) => {
    const body = "body" in post ? String(post.body ?? "") : "";
    const excerpt = body
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#>*_`\-[\]()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);

    return {
      title: post.data.title,
      description: post.data.description,
      date: post.data.date.toISOString(),
      updated: post.data.updated?.toISOString() ?? "",
      tags: post.data.tags,
      category: getCategory(post),
      series: getSeries(post),
      image: getImageUrl(post, withBase),
      url: `/blog/${post.id}/`,
      reading: getReadingStats(post).label,
      excerpt,
    };
  });

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

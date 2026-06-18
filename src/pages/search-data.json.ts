import { getCollection } from "astro:content";
import { getCategory, getReadingStats, isPublished, sortPosts } from "../lib/blog";

export async function GET() {
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
      tags: post.data.tags,
      category: getCategory(post),
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

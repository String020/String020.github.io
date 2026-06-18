import { getCollection } from "astro:content";
import { site as siteData } from "../data/site";
import { getCategory, isPublished, sortPosts } from "../lib/blog";

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const makeUrl = (origin: string, base: string, path: string) =>
  new URL(`${base.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`, origin).toString();

export async function GET({ site }: { site?: URL }) {
  const origin = site?.toString() ?? "https://string020.github.io";
  const base = import.meta.env.BASE_URL || "/";
  const posts = sortPosts((await getCollection("blog")).filter(isPublished));

  const items = posts
    .map((post) => {
      const url = makeUrl(origin, base, `/blog/${post.id}/`);
      return `
        <item>
          <title>${escapeXml(post.data.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid>${escapeXml(url)}</guid>
          <pubDate>${post.data.date.toUTCString()}</pubDate>
          <category>${escapeXml(getCategory(post))}</category>
          ${post.data.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("")}
          <description>${escapeXml(post.data.description)}</description>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteData.title)}</title>
    <description>${escapeXml(siteData.description)}</description>
    <link>${escapeXml(makeUrl(origin, base, "/"))}</link>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

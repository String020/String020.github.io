import { getCollection } from "astro:content";
import { site as siteData } from "../data/site";
import { getAllCategories, getAllSeries, getAllTags, isPublished, slugifyTaxonomy, sortPosts } from "../lib/blog";

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
  const tags = getAllTags(posts);
  const categories = getAllCategories(posts);
  const seriesList = getAllSeries(posts);

  const paths = [
    "/",
    "/blog/",
    "/blog/archive/",
    "/blog/writing-guide/",
    "/search/",
    ...siteData.featurePages.map((page) => `/${page.slug}/`),
    ...posts.map((post) => `/blog/${post.id}/`),
    ...tags.map((tag) => `/blog/tag/${slugifyTaxonomy(tag)}/`),
    ...categories.map((category) => `/blog/category/${slugifyTaxonomy(category)}/`),
    ...seriesList.map((series) => `/blog/series/${slugifyTaxonomy(series)}/`),
  ];

  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(makeUrl(origin, base, path))}</loc></url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

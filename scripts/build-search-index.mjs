// Builds the Pagefind full-text index for the built site in dist/.
// Only post pages carry data-pagefind-body, so only they are handed to Pagefind. Unlike the CLI,
// an empty blog is not an error: the portal search falls back to the post list until a post exists.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import * as pagefind from "pagefind";

const siteDir = "dist";

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(fullPath);
    else if (entry.name.endsWith(".html")) yield fullPath;
  }
}

const { index, errors: createErrors } = await pagefind.createIndex({ forceLanguage: "zh-cn" });
if (!index) throw new Error(`Pagefind could not start: ${createErrors.join("; ")}`);

let postCount = 0;
for await (const file of htmlFiles(siteDir)) {
  const content = await readFile(file, "utf8");
  if (!content.includes("data-pagefind-body")) continue;
  const sourcePath = path.relative(siteDir, file).split(path.sep).join("/");
  const { errors } = await index.addHTMLFile({ sourcePath, content });
  if (errors.length) throw new Error(`Pagefind could not index ${sourcePath}: ${errors.join("; ")}`);
  postCount += 1;
}

if (postCount === 0) {
  console.log("[search] No posts to index yet; skipping the Pagefind index.");
} else {
  const { errors } = await index.writeFiles({ outputPath: path.join(siteDir, "pagefind") });
  if (errors.length) throw new Error(`Pagefind could not write the index: ${errors.join("; ")}`);
  console.log(`[search] Indexed ${postCount} post${postCount === 1 ? "" : "s"} with Pagefind.`);
}

await pagefind.close();

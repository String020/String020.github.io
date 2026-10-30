import { editorPosts, portalContent } from "../lib/portal-content";

// Full published content, including every editor post, for the portal editor to start from.
export function GET() {
  return new Response(JSON.stringify({ ...portalContent, posts: editorPosts }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

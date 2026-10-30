import { portalContent } from "../lib/portal-content";

// Full published content, including editor posts, for the portal editor to start from.
export function GET() {
  return new Response(JSON.stringify(portalContent), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

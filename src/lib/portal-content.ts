import portalContentData from "../data/portal-content.json";

export type CardWidth = "half" | "full";
export type CardType = "text" | "page";
export type NavigationKind = "home" | "blog" | "managed";

export type CardDestination =
  | { kind: "page"; pageId: string }
  | { kind: "url"; href: string };

export type CardAction = {
  id: string;
  label: string;
  href: string;
};

export type CardBlock = {
  id: string;
  type: CardType;
  width: CardWidth;
  badge: string;
  title: string;
  summary: string;
  image?: { src: string; alt: string; caption?: string } | null;
  destination?: CardDestination;
  actions?: CardAction[];
};

export type RichBlock =
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "heading"; level: 2 | 3; text: string }
  | { id: string; type: "image"; src: string; alt: string; caption?: string; width?: "normal" | "full" }
  | { id: string; type: "list"; style: "unordered" | "ordered" | "todo"; items: string[] }
  | { id: string; type: "link"; label: string; href: string }
  | { id: string; type: "quote"; text: string }
  | { id: string; type: "divider" }
  | { id: string; type: "code"; language?: string; code: string };

export type NavigationSection = {
  id: string;
  kind: NavigationKind;
  title: string;
  label: string;
  slug: string;
  description: string;
  locked: boolean;
  blocks: CardBlock[];
};

export type ManagedPage = {
  id: string;
  parentNavigationId: string;
  title: string;
  slug: string;
  route: string;
  description: string;
  badge: string;
  shareImage: string | null;
  content: RichBlock[];
};

/** A blog post written in the online editor; published posts are merged into the blog collection. */
export type EditorPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string | null;
  category: string;
  tags: string[];
  series?: string;
  lang?: string;
  pinned: boolean;
  draft: boolean;
  comment: boolean;
  image?: string | null;
  /** Markdown; uploaded images appear as `asset://<id>` and resolve through `assets`. */
  body: string;
  /** Maps asset ids to `asset://<id>` in drafts, replaced with public URLs when published. */
  assets?: Record<string, string>;
};

export type PortalContent = {
  schemaVersion: number;
  publishedAt: string;
  navigation: NavigationSection[];
  pages: ManagedPage[];
  redirects: Array<{ from: string; to: string }>;
  posts?: EditorPost[];
};

export const portalContent = portalContentData as PortalContent;

// Published editor posts are one file each in src/data/posts; the first editor version kept them in
// portal-content.json, so both sources are read and files win when a post appears in both.
const postFiles = import.meta.glob<EditorPost>("../data/posts/*.json", { eager: true, import: "default" });
const postsById = new Map((portalContent.posts ?? []).map((post) => [post.id, post]));
Object.values(postFiles).forEach((post) => postsById.set(post.id, post));

export const editorPosts = Array.from(postsById.values());

const isPublicUrl = (value: string | null | undefined) => /^(https?:)?\/\//.test(value ?? "") || (value ?? "").startsWith("/");

/** Swaps `asset://<id>` image references in a post body for their published URLs. */
export const resolveEditorPostBody = (post: EditorPost) =>
  post.body.replace(/asset:\/\/([a-f0-9-]{36})/g, (reference, id: string) => {
    const url = post.assets?.[id];
    return url && isPublicUrl(url) ? url : reference;
  });

/** The cover image, or undefined while it still points at an unpublished upload. */
export const resolveEditorPostImage = (post: EditorPost) => (post.image && isPublicUrl(post.image) ? post.image : undefined);

export const managedNavigation = portalContent.navigation.filter(
  (item) => item.kind === "managed",
);

export const pageById = new Map(portalContent.pages.map((page) => [page.id, page]));

export const normalizeRoute = (route: string) => route.replace(/^\/+|\/+$/g, "");

export const cardHref = (card: CardBlock) => {
  if (!card.destination) return null;
  if (card.destination.kind === "url") return card.destination.href;
  const page = pageById.get(card.destination.pageId);
  return page ? `${normalizeRoute(page.route)}/` : null;
};

export const navigationHref = (item: NavigationSection) =>
  item.slug ? `${normalizeRoute(item.slug)}/` : "";

export function assertPortalContent(value: unknown): asserts value is PortalContent {
  if (!value || typeof value !== "object") throw new Error("Portal content must be an object.");
  const candidate = value as Partial<PortalContent>;
  if (candidate.schemaVersion !== 1) throw new Error("Unsupported portal content schema.");
  if (!Array.isArray(candidate.navigation) || !Array.isArray(candidate.pages)) {
    throw new Error("Portal content is missing navigation or pages.");
  }
  const ids = new Set<string>();
  for (const item of candidate.navigation) {
    if (!item.id || ids.has(item.id)) throw new Error("Navigation ids must be unique.");
    ids.add(item.id);
  }
  const stringSection = candidate.navigation.find((item) => item.id === "string");
  const blogSection = candidate.navigation.find((item) => item.id === "blog");
  if (!stringSection?.locked || !blogSection?.locked) {
    throw new Error("STRING and BLOG must remain protected in schema version 1.");
  }
}

export const site = {
  title: "Str1ng Personal Portal",
  description: "A personal portal with blog posts, archives, interest pages, profile pages, search, and future widgets.",
  brand: {
    name: "Str1ng",
    initials: "S0",
  },
  profile: {
    name: "String",
    summary: "且把悲欢歌唱",
    links: [
      { label: "GitHub", href: "https://github.com/String020" },
      { label: "Blog", href: "blog/" },
      { label: "Contact", href: "contact/" },
    ],
    notice: "欢迎来访！网站仍在持续建设中，新文章和页面会陆续更新。",
    tags: ["Blog", "Archives", "My", "About"],
  },
  dashboard: {
    eyebrow: "String",
    title: "Dashboard.",
    stats: [
      { value: "05", label: "Main sections" },
      { value: "02", label: "Blog posts" },
      { value: "04", label: "About routes" },
      { value: "01", label: "Future lab" },
    ],
    focus: {
      title: "Current structure",
      text: "持续更新中",
      progress: 78,
    },
    today: ["增加更多新内容", "完善博客文章", "更新个人资料", "优化网站布局"],
  },
  blog: {
    eyebrow: "Blog",
    title: "Blog center for posts and notes.",
    intro: "Browse every post, search by keyword, explore the archive, or follow along with RSS.",
    actions: [
      { label: "Timeline", href: "blog/archive/" },
      { label: "Search", href: "search/" },
      { label: "Archives", href: "archives/" },
      { label: "Writing guide", href: "blog/writing-guide/" },
      { label: "RSS feed", href: "rss.xml" },
    ],
  },
  comments: {
    // Giscus threads live in Discussions of this public repository (Announcements category).
    repo: "String020/blog-comments",
    repoId: "R_kgDOVc-zog",
    category: "Announcements",
    categoryId: "DIC_kwDOVc-zos4DJ_xY",
  },
  lab: {
    eyebrow: "Lab",
    items: ["Widget dock", "Mini apps", "Layout presets", "Music widget", "Guestbook later"],
  },
} as const;

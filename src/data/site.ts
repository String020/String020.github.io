export const site = {
  title: "Str1ng Personal Portal",
  description: "A personal website prototype with portal navigation, projects, notes, skills, and blog posts.",
  brand: {
    name: "Str1ng",
    initials: "YN",
  },
  nav: ["STR1NG", "FOR YOU", "UPCOMING", "SCHEDULE", "UPDATES", "BLOG"],
  profile: {
    name: "Your Name",
    summary: "CS student building useful tools, clean interfaces, and study systems.",
    links: [
      { label: "GitHub", href: "#" },
      { label: "Resume", href: "#" },
      { label: "Email", href: "mailto:your.email@example.com" },
    ],
    notice: "Prototype view: test the style, spacing, and page switching before replacing real content.",
    tags: ["Portfolio", "Projects", "Campus", "Study"],
  },
  dashboard: {
    eyebrow: "Dashboard",
    title: "Welcome back, Your Name.",
    stats: [
      { value: "04", label: "Active projects" },
      { value: "12", label: "Study notes" },
      { value: "08", label: "Core skills" },
      { value: "24", label: "Updates" },
    ],
    focus: {
      title: "Current focus",
      text: "Prepare a cleaner personal website that feels like a student portal rather than a generic landing page.",
      progress: 72,
    },
    today: ["Polish layout direction", "Replace placeholder profile text", "Choose final project categories"],
  },
  projects: {
    eyebrow: "Selected work",
    title: "Projects that explain what I can build.",
    items: [
      {
        title: "Course Planner",
        text: "A small dashboard for assignments, deadlines, and weekly study plans.",
        href: "#",
      },
      {
        title: "Algorithm Visual Notes",
        text: "Beginner-friendly notes that turn data structures into diagrams and examples.",
        href: "#",
      },
      {
        title: "Cloud Demo Lab",
        text: "Experiments with simple hosting, serverless functions, and deployment workflows.",
        href: "#",
      },
    ],
  },
  skills: {
    eyebrow: "Skill display",
    title: "Technical abilities in a compact panel.",
    items: [
      {
        badge: "JS",
        title: "JavaScript",
        text: "UI logic, DOM interaction, and small frontend prototypes.",
        progress: 78,
      },
      {
        badge: "PY",
        title: "Python",
        text: "Automation, scripts, data processing, and coursework tools.",
        progress: 82,
      },
      {
        badge: "UI",
        title: "Web UI",
        text: "Responsive pages, layout systems, and clean component styling.",
        progress: 74,
      },
      {
        badge: "Git",
        title: "Git",
        text: "Version control, GitHub Pages, and project publishing.",
        progress: 68,
      },
    ],
  },
  notes: {
    eyebrow: "Notes",
    title: "Short updates and study fragments.",
    primary: {
      title: "Todo list",
      text: "FIT1008 review, portfolio refresh, cloud hosting notes, and assignment checkpoints.",
    },
    secondary: {
      title: "Idea",
      text: "Use the website like a personal dashboard: project status, notes, skills, links, contact.",
    },
  },
  contact: {
    eyebrow: "Contact",
    title: "Simple links without a heavy landing page.",
    links: [
      { label: "Email", value: "your.email@example.com", href: "mailto:your.email@example.com" },
      { label: "GitHub", value: "github.com/yourname", href: "#" },
      { label: "LinkedIn", value: "linkedin.com/in/yourname", href: "#" },
    ],
  },
  blog: {
    eyebrow: "Blog",
    title: "Markdown posts for longer notes.",
    intro: "Write posts in src/content/blog. Each Markdown file becomes a real article page after build.",
  },
} as const;

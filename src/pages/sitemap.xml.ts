import { SITE_URL, absolute } from "../data/site";
import { getInterviews } from "../data/interviews";
import { TOPICS } from "../data/questions";
import { shareUrl } from "../lib/images";

// Static pages: bump `lastmod` by hand when you edit one of them.
const PAGES = [
  { path: "books.html", lastmod: "2026-10-09", changefreq: "weekly", priority: "0.7" },
  { path: "about.html", lastmod: "2026-10-09", changefreq: "monthly", priority: "0.5" },
  { path: "sponsor.html", lastmod: "2026-10-09", changefreq: "monthly", priority: "0.4" },
];

export async function GET() {
  const interviews = await getInterviews();
  const latest = interviews.map((i) => i.modified).sort().at(-1);
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: latest, changefreq: "weekly", priority: "1.0" },
    { loc: absolute("people.html"), lastmod: latest, changefreq: "weekly", priority: "0.7" },
    { loc: absolute("questions.html"), lastmod: latest, changefreq: "weekly", priority: "0.7" },
    ...TOPICS.map((topic) => ({ loc: absolute(`questions/${topic.slug}.html`), lastmod: latest, changefreq: "weekly", priority: "0.6" })),
    ...PAGES.map((page) => ({ ...page, loc: absolute(page.path) })),
    ...(await Promise.all(
      interviews.map(async (i) => ({
        loc: absolute(`articles/${i.slug}.html`),
        lastmod: i.modified,
        changefreq: "monthly",
        priority: "0.8",
        image: await shareUrl(i.photo),
      }))
    )),
  ];

  const body = urls
    .map(
      (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>${
      "image" in url ? `\n    <image:image><image:loc>${url.image}</image:loc></image:image>` : ""
    }
  </url>`
    )
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`,
    { headers: { "Content-Type": "application/xml" } }
  );
}

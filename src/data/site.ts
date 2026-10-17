import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export const SITE_URL = "https://databasestory.com";
export const SUBSTACK = "https://databasestory.substack.com";
export const DEFAULT_OG = "assets/og-default.jpg";

export const NAV = [
  { label: "About", href: "about.html" },
  { label: "Interviews", href: "#interviews" },
  { label: "People", href: "people.html" },
  { label: "Books", href: "books.html" },
  { label: "Podcast", href: "#podcast" },
  { label: "Sponsor", href: "sponsor.html" },
];

// Cache-busting version for site.js: changes whenever the file does.
export const ASSET_VERSION = createHash("md5")
  .update(readFileSync("public/site.js"))
  .digest("hex")
  .slice(0, 8);

export const absolute = (path: string) => `${SITE_URL}/${path.replace(/^\.?\//, "")}`;

export const ORG = {
  "@type": "Organization",
  name: "DatabaseStory",
  url: `${SITE_URL}/`,
  logo: { "@type": "ImageObject", url: `${SITE_URL}/icon-512.png` },
};

export const breadcrumb = (items: { name: string; url: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

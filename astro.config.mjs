import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { satteri } from "@astrojs/markdown-satteri";
import { transform } from "esbuild";
import { externalLinks, questionIds } from "./src/lib/markdown.mjs";

// site.js is a classic script served from public/ (it re-runs itself when the
// audio player swaps pages), so Astro leaves it alone: minify the built copy.
const minifySiteJs = {
  name: "minify-site-js",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      const file = new URL("site.js", dir);
      const { code } = await transform(await readFile(file, "utf8"), { minify: true, target: "es2020" });
      await writeFile(file, code);
    },
  },
};

// Static site served by GitHub Pages. `format: "file"` keeps the existing URLs
// (/about.html, /articles/franck-pachot.html) so links, canonicals and site.js keep working.
export default defineConfig({
  site: "https://databasestory.com",
  build: {
    format: "file",
    // One stylesheet for the whole site, written into each page: no extra request
    // before the first paint.
    inlineStylesheets: "always",
  },
  trailingSlash: "ignore",
  // Fetch a page as soon as the pointer rests on a link to it.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  integrations: [mdx(), minifySiteJs],
  markdown: {
    processor: satteri({
      hastPlugins: [questionIds, externalLinks],
      // Keep the interviews' punctuation as typed; `## Question {#custom-id}` pins an anchor.
      features: { smartPunctuation: false, headingAttributes: true },
    }),
  },
});

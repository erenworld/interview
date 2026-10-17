import { existsSync } from "node:fs";
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { ICONS } from "./data/icons";

// YAML reads 2026-10-12 as a date: keep it as "2026-10-12".
const day = z.coerce.date().transform((date) => date.toISOString().slice(0, 10));
// Catch a typo or a forgotten photo. Photos are in src/assets/ (resized at build
// time), share images in public/assets/og/ (served as they are).
const fileIn = (dir: string) =>
  z.string().refine((path) => existsSync(`${dir}/${path}`), {
    error: (issue) => `${dir}/${issue.input} does not exist`,
  });
const image = fileIn("src");
const publicFile = fileIn("public");

// One .mdx file per interview: the guest's details in the frontmatter, the
// interview below it. The file name is the URL: franck-pachot.mdx → /articles/franck-pachot.html.
const interviews = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/interviews" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    published: day,
    modified: day,
    excerpt: z.string(),
    tags: z.array(z.string()).min(1),
    photo: image, // card and featured photo
    face: image, // small round avatar
    ogImage: publicFile.nullable().default(null), // share image, falls back to the default one
    voice: z.enum(["male", "female"]), // voice used by tools/voices/generate.py
    quote: z.string().nullable().default(null),
    links: z.array(z.object({ kind: z.enum(Object.keys(ICONS) as [string, ...string[]]), url: z.string().url() })),
    // Extra schema.org Person fields
    alternateName: z.string().optional(),
    worksFor: z.object({ name: z.string(), url: z.string().url() }).optional(),
  }),
});

export const collections = { interviews };

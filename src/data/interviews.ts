import { getCollection, type CollectionEntry } from "astro:content";

// To publish an interview, add src/content/interviews/<slug>.mdx (npm run new).
// Everything else (home cards, People page, article navigation, sitemap) is
// generated from these files.
export type Interview = CollectionEntry<"interviews">["data"] & {
  slug: string;
  entry: CollectionEntry<"interviews">;
};

let cache: Interview[] | undefined;

// Newest first.
export const getInterviews = async () =>
  (cache ??= (await getCollection("interviews"))
    .map((entry) => ({ ...entry.data, slug: entry.id, entry }))
    .sort((a, b) => b.published.localeCompare(a.published)));

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

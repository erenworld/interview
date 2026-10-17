import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";
import { absolute } from "../data/site";

// Images live in src/assets/ and are referenced as "assets/<path>", like
// "assets/franck.jpeg" in an interview's frontmatter. At build time each one is
// resized to the size it is shown at and converted to WebP.
const files = import.meta.glob<{ default: ImageMetadata }>("/src/assets/**/*.{jpg,jpeg,png,svg}", { eager: true });

export const source = (path: string) => {
  const file = files[`/src/${path}`];
  if (!file) throw new Error(`Missing image src/${path}`);
  return file.default;
};

type Size = { width?: number; height?: number; densities?: number[]; widths?: number[]; quality?: number };

// src and srcset for an <img>. With `width` (or `height`) and `densities`, a 2x
// version is included for sharp screens; with `widths`, add a `sizes` attribute.
export const optimized = async (path: string, size: Size) => {
  const src = source(path);
  if (src.format === "svg") return { src: src.src, srcset: undefined };
  const image = await getImage({ src, format: "webp", quality: 75, ...size });
  return { src: image.src, srcset: image.srcSet.attribute || undefined };
};

// A full URL to a JPEG version, for structured data and the sitemap.
export const shareUrl = async (path: string) =>
  absolute((await getImage({ src: source(path), width: 800, format: "jpg" })).src);

import { readdirSync } from "node:fs";
import type { APIRoute } from "astro";
import sharp from "sharp";

// /assets/faces/<slug>.jpg, small avatars linked from the Books page and site.js.
// Pages built by Astro use their own resized copies (src/lib/images.ts).
export const getStaticPaths = () =>
  readdirSync("src/assets/faces")
    .filter((file) => file.endsWith(".jpg"))
    .map((file) => ({ params: { name: file.slice(0, -4) } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(
    new Uint8Array(await sharp(`src/assets/faces/${params.name}.jpg`).resize(112, 112).jpeg({ quality: 80, mozjpeg: true }).toBuffer()),
    { headers: { "Content-Type": "image/jpeg" } }
  );

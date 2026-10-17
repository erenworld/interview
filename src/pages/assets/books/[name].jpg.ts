import { readdirSync } from "node:fs";
import type { APIRoute } from "astro";
import sharp from "sharp";

// /assets/books/<book>.jpg, the covers on the Books page (shown up to 440px tall).
export const getStaticPaths = () =>
  readdirSync("src/assets/books")
    .filter((file) => file.endsWith(".jpg"))
    .map((file) => ({ params: { name: file.slice(0, -4) } }));

export const GET: APIRoute = async ({ params }) =>
  new Response(
    new Uint8Array(
      await sharp(`src/assets/books/${params.name}.jpg`)
        .resize({ height: 500, withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer()
    ),
    { headers: { "Content-Type": "image/jpeg" } }
  );

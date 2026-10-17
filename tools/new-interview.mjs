// Scaffold a new interview: creates src/content/interviews/<slug>.mdx with the
// guest's details to fill in and a starter body.
//
//   npm run new -- "Jane Doe"
import { existsSync, writeFileSync } from "node:fs";

const name = process.argv.slice(2).join(" ").trim();
if (!name) {
  console.error('Usage: npm run new -- "Guest Name"');
  process.exit(1);
}

const slug = name
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");
const file = `src/content/interviews/${slug}.mdx`;

if (existsSync(file)) {
  console.error(`${file} already exists.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
name: ${name}
role: Role @Company
published: ${today}
modified: ${today}
excerpt: ${name.split(" ")[0]} talks about ...
tags: [Interviews, Databases]
photo: assets/${slug}.jpg
face: assets/faces/${slug}.jpg
ogImage: null
voice: male
quote: null
links:
  - kind: LinkedIn
    url: https://www.linkedin.com/in/...
---

*${name} is ...*

## Can you introduce yourself?

...

## Where can people find your work online?

- [${name} on LinkedIn](https://www.linkedin.com/in/...)
`
);

console.log(`Created ${file}.
Next:
  1. Fill in the details at the top (role, excerpt, tags, links, quote, voice).
  2. Write the interview below them: "## Question?" then the answer.
  3. Add the photos: src/assets/${slug}.jpg and src/assets/faces/${slug}.jpg (square),
     at full size: the build resizes them. Optional share image (1200x630):
     public/assets/og/${slug}.jpg, then set "ogImage".
  4. Check it with npm run dev.`);

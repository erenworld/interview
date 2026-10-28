import { existsSync, readFileSync, statSync } from "node:fs";
import { OP3_PREFIX, SITE_URL, absolute } from "../data/site";
import { getInterviews } from "../data/interviews";
import { chaptersOf, timestamp } from "../lib/questions";

// Podcast RSS feed, submitted once to Apple Podcasts, Spotify, Deezer and Amazon Music.
// An interview becomes an episode as soon as public/assets/audio/<slug>.mp3 exists
// (its .json gives the duration).
const SHOW = {
  title: "DatabaseStory",
  author: "Eren Turkoglu",
  email: "erenxturkoglu@gmail.com",
  description:
    "Long-form conversations with the engineers, open-source contributors and founders behind PostgreSQL, MongoDB, Oracle, storage engines and distributed systems.",
  cover: absolute("assets/podcast-cover.jpg"), // 3000×3000, Apple wants 1400–3000 square
  // podcast:guid, UUIDv5 of "databasestory.com/podcast.xml" (Podcasting 2.0 namespace): never change it.
  guid: "48fcd006-2190-5cc5-8afd-64b1dc578509",
};

const escape = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (iso: string) => new Date(`${iso}T08:00:00Z`).toUTCString();

export async function GET() {
  const episodes = (await getInterviews())
    .filter((i) => existsSync(`public/assets/audio/${i.slug}.mp3`))
    .map((i) => {
      const mp3 = `public/assets/audio/${i.slug}.mp3`;
      const json = `public/assets/audio/${i.slug}.json`;
      const duration = existsSync(json) ? Math.round(JSON.parse(readFileSync(json, "utf8")).duration) : null;
      const page = absolute(`articles/${i.slug}.html`);
      // Chapters twice: podcast:chapters for the apps that read it, timestamps in
      // the description for Spotify and the others, which build chapters from them.
      const chapters = chaptersOf(i.slug, i.entry.body ?? "");
      const toc = chapters ? `\n\n${chapters.map((c) => `${timestamp(c.startTime)} ${c.title}`).join("\n")}` : "";
      return `    <item>
      <title>${escape(`${i.name}, ${i.role}`)}</title>
      <description>${escape(`${i.excerpt}\n\nRead the interview: ${page}${toc}`)}</description>
      <link>${page}</link>
      <guid isPermaLink="false">databasestory-${i.slug}</guid>
      <pubDate>${rfc822(i.published)}</pubDate>
      <enclosure url="${OP3_PREFIX}${absolute(`assets/audio/${i.slug}.mp3`).replace(/^https:\/\//, "")}" length="${statSync(mp3).size}" type="audio/mpeg" />${
        duration ? `\n      <itunes:duration>${duration}</itunes:duration>` : ""
      }
${
        chapters ? `      <podcast:chapters url="${absolute(`chapters/${i.slug}.json`)}" type="application/json+chapters" />\n` : ""
      }      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
    </item>`;
    });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${SHOW.title}</title>
    <link>${SITE_URL}/</link>
    <atom:link href="${absolute("podcast.xml")}" rel="self" type="application/rss+xml" />
    <language>en</language>
    <description>${escape(SHOW.description)}</description>
    <copyright>© ${new Date().getFullYear()} ${SHOW.author}</copyright>
    <itunes:author>${SHOW.author}</itunes:author>
    <podcast:guid>${SHOW.guid}</podcast:guid>
    <itunes:owner>
      <itunes:name>${SHOW.author}</itunes:name>
      <itunes:email>${SHOW.email}</itunes:email>
    </itunes:owner>
    <itunes:image href="${SHOW.cover}" />
    <image>
      <url>${SHOW.cover}</url>
      <title>${SHOW.title}</title>
      <link>${SITE_URL}/</link>
    </image>
    <itunes:category text="Technology" />
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
${episodes.join("\n")}
  </channel>
</rss>
`,
    { headers: { "Content-Type": "application/rss+xml" } }
  );
}

import rss from "@astrojs/rss";
import { SITE_URL, absolute } from "../data/site";
import { getInterviews } from "../data/interviews";

// The interviews as an RSS feed, for feed readers (the newsletter lives on Substack).
export async function GET() {
  const interviews = await getInterviews();
  return rss({
    title: "DatabaseStory",
    description: "Interviews with the people behind databases and distributed systems.",
    site: SITE_URL,
    customData: `<language>en</language><image><url>${absolute("icon-512.png")}</url><title>DatabaseStory</title><link>${SITE_URL}/</link></image>`,
    items: interviews.map((i) => ({
      title: `Interview with ${i.name}, ${i.role}`,
      link: absolute(`articles/${i.slug}.html`),
      pubDate: new Date(`${i.published}T08:00:00Z`),
      description: i.excerpt,
      author: "Eren Turkoglu",
      categories: i.tags,
    })),
  });
}

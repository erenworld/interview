import { getInterviews } from "../../data/interviews";
import { chaptersOf } from "../../lib/questions";

// Podcast 2.0 chapters (podcast:chapters in podcast.xml), one file per recorded interview.
export async function getStaticPaths() {
  return (await getInterviews())
    .map((i) => ({ params: { slug: i.slug }, props: { chapters: chaptersOf(i.slug, i.entry.body ?? "") } }))
    .filter((path) => path.props.chapters);
}

export function GET({ props }: { props: { chapters: NonNullable<ReturnType<typeof chaptersOf>> } }) {
  const chapters = props.chapters.map(({ startTime, title }) => ({ startTime, title }));
  return new Response(JSON.stringify({ version: "1.2.0", chapters }), {
    headers: { "Content-Type": "application/json+chapters" },
  });
}

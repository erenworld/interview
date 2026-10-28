import { existsSync, readFileSync } from "node:fs";
import GithubSlugger from "github-slugger";
import { questionId } from "./markdown.mjs";

export type Question = { id: string; title: string; answer: string };
export type Chapter = { startTime: number; title: string; id: string | null };

// Markdown to plain text: links keep their label, emphasis and code marks go.
export const plain = (markdown: string) =>
  markdown
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

// The questions of an interview, read from its MDX, with the same ids as the
// anchors on the page (see questionIds in markdown.mjs).
export const questionsOf = (body: string): Question[] => {
  const seen = new GithubSlugger();
  const questions: Question[] = [];
  for (const line of body.split("\n")) {
    const heading = line.match(/^## (.+?)\s*(?:\{#([\w-]+)\})?\s*$/);
    if (heading) {
      const title = plain(heading[1]);
      questions.push({ id: heading[2] ?? questionId(seen, title), title, answer: "" });
    } else if (questions.length) {
      questions[questions.length - 1].answer += `${line}\n`;
    }
  }
  return questions;
};

// The start of an answer as plain text, about `words` long, cut after a sentence when possible.
export const excerpt = (answer: string, words = 90) => {
  const paragraphs = answer
    .replace(/<([A-Z]\w*)[\s\S]*?(?:\/>|<\/\1>)/g, "") // MDX components (<Place />, <Shelf>…</Shelf>)
    .split(/\n\s*\n/)
    .map((p) => plain(p.replace(/^\s*(?:>|[-*]|\d+\.)\s+/gm, "")))
    .filter((p) => p && !p.startsWith("<"));
  let text = "";
  for (const paragraph of paragraphs) {
    text = text ? `${text} ${paragraph}` : paragraph;
    if (text.split(" ").length >= words) break;
  }
  const cut = text.split(" ");
  if (cut.length <= words * 1.3) return text;
  const short = cut.slice(0, words).join(" ");
  const sentenceEnd = short.search(/[.!?…][^.!?…]*$/);
  return sentenceEnd > short.length * 0.5 ? short.slice(0, sentenceEnd + 1) : `${short.replace(/[,;:]$/, "")}…`;
};

// Podcast chapters: the intro, then one per question, from the recording's
// timings (public/assets/audio/<slug>.json). Null without a recording.
export const chaptersOf = (slug: string, body: string): Chapter[] | null => {
  const json = `public/assets/audio/${slug}.json`;
  if (!existsSync(json)) return null;
  const { segments } = JSON.parse(readFileSync(json, "utf8")) as { segments: { t: number; id: string | null }[] };
  const titles = new Map(questionsOf(body).map((q) => [q.id, q.title]));
  const chapters: Chapter[] = [{ startTime: 0, title: "Introduction", id: null }];
  const seen = new Set<string>();
  for (const segment of segments) {
    if (!segment.id || seen.has(segment.id) || !titles.has(segment.id)) continue;
    seen.add(segment.id);
    chapters.push({ startTime: Math.round(segment.t), title: titles.get(segment.id)!, id: segment.id });
  }
  return chapters;
};

export const timestamp = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${String(m).padStart(2, "0")}:${s}`;
};

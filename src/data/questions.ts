import { getInterviews, type Interview } from "./interviews";
import { excerpt, questionsOf } from "../lib/questions";

// Questions asked to several guests, one page each (/questions/<slug>.html).
// `answers` maps a guest (interview file name) to the anchor of their question,
// as it appears in the article URL: articles/<guest>.html#<anchor>.
// A typo here fails the build.
export const TOPICS: { slug: string; title: string; intro: string; answers: Record<string, string> }[] = [
  {
    slug: "will-ai-replace-junior-engineers",
    title: "Will AI replace junior engineers?",
    intro: "The question every guest gets. Founders, DBAs, managers and open-source contributors on what AI means for people starting out.",
    answers: {
      "alex-padula": "will-ai-replace-junior-engineers",
      "bertrand-drouvot": "do-you-think-ai-impacts-junior-developers",
      "cedric-villemain": "do-you-think-ai-will-replace-junior-developers",
      "cornelia-biacsics": "will-ai-replace-juniors",
      "damien-clochard": "will-ai-replace-junior-developers",
      "ege-gunes": "will-juniors-be-replaced-by-ai",
      "elisa-usai": "and-the-juniors-so-does-that-come-back-to-the-same-thing",
      "flora-barriele": "does-ai-replace-juniors",
      "franck-pachot": "what-do-you-think-about-the-place-of-juniors-in-this-ai",
      "matt-cornillon": "will-ai-replace-juniors",
      "mikael-francoeur": "does-ai-replace-juniors",
      "yves-colin": "what-do-you-think-about-the-idea-that-ai-will-replace",
    },
  },
  {
    slug: "how-do-you-use-ai",
    title: "How do you use AI in your work?",
    intro: "Workflows, tools, and where they draw the line.",
    answers: {
      "alex-padula": "you-started-programming-at-12-or-13-how-does-ai-change",
      "bertrand-drouvot": "what-do-you-think-about-the-impact-of-ai",
      "cedric-villemain": "do-you-use-ai-in-your-day-to-day-work",
      "cornelia-biacsics": "how-do-you-use-ai-tools-in-your-day-to-day-work",
      "damien-clochard": "whats-your-ai-workflow",
      "ege-gunes": "how-do-you-use-ai-yourself",
      "elisa-usai": "how-have-you-used-ai",
      "flora-barriele": "speaking-of-automation-that-brings-us-to-ai-what-do-you",
      "matt-cornillon": "how-do-you-use-ai-day-to-day",
      "mikael-francoeur": "how-do-you-use-ai",
      "yves-colin": "whats-your-ai-workflow",
    },
  },
  {
    slug: "advice-for-junior-engineers",
    title: "What advice would you give a junior engineer?",
    intro: "How to stand out, what to learn, and what to stop worrying about.",
    answers: {
      "bertrand-drouvot": "what-do-you-think-can-help-young-developers-today",
      "cedric-villemain": "and-whats-your-own-advice-for-young-people",
      "cornelia-biacsics": "what-advice-would-you-give-to-a-junior-in-this-era",
      "damien-clochard": "how-can-a-junior-stand-out-in-your-eyes",
      "ege-gunes": "what-do-you-recommend-to-junior-developers",
      "franck-pachot": "and-what-would-your-advice-be",
      "mikael-francoeur": "whats-the-specific-advice-for-juniors",
      "yves-colin": "how-can-a-junior-stand-out-in-your-view-what-makes-a-good",
    },
  },
  {
    slug: "best-advice-received",
    title: "What's the best advice you've ever received?",
    intro: "The sentences and the people that stayed with them.",
    answers: {
      "cedric-villemain": "whats-the-best-piece-of-advice-youve-ever-received",
      "damien-clochard": "is-there-a-piece-of-advice-or-an-encounter-that-marked-you",
      "ege-gunes": "whats-the-best-advice-youve-received-in-your-life",
      "elisa-usai": "do-you-have-a-piece-of-advice-that-struck-you-since-the",
      "franck-pachot": "what-is-the-best-advice-you-have-ever-received",
      "matt-cornillon": "what-is-the-best-advice-you-have-been-given",
      "mikael-francoeur": "have-you-received-advice-that-changed-you-that-really-helped",
      "yves-colin": "is-there-an-encounter-or-piece-of-advice-that-really-marked",
    },
  },
  {
    slug: "how-did-you-get-into-databases",
    title: "How did you get into databases?",
    intro: "Law, music, marketing, networks: almost nobody planned it.",
    answers: {
      "bertrand-drouvot": "how-did-you-discover-databases",
      "cedric-villemain": "how-did-you-end-up-in-databases",
      "cornelia-biacsics": "when-did-you-first-hear-about-postgresql",
      "damien-clochard": "what-were-you-doing-before-postgresql",
      "ege-gunes": "how-did-you-get-into-databases",
      "flora-barriele": "how-did-you-end-up-in-it",
      "matt-cornillon": "what-attracts-you-to-postgresql",
      "mikael-francoeur": "how-did-you-end-up-in-databases",
      "yves-colin": "what-attracted-you-to-the-world-of-databases",
    },
  },
  {
    slug: "how-to-learn-databases",
    title: "Where should you start to learn databases?",
    intro: "First projects, courses and habits, from people who learned on the job.",
    answers: {
      "alex-padula": "what-would-you-tell-someone-who-wants-to-get-into-databases",
      "cedric-villemain": "do-you-have-resources-to-recommend-for-learning-postgresql",
      "cornelia-biacsics": "how-did-you-learn-databases-and-postgresql",
      "ege-gunes": "what-do-you-recommend-to-become-a-good-database-engineer",
      "matt-cornillon": "how-did-you-train-yourself-on-postgresql",
      "mikael-francoeur": "if-someone-has-no-background-in-databases-and-wants-to",
      "yves-colin": "if-someone-wants-to-get-into-databases-and-doesnt-know-where",
    },
  },
  {
    slug: "what-the-best-engineers-share",
    title: "What do the best engineers have in common?",
    intro: "Traits and habits they noticed in the people they admire, hire, or work next to.",
    answers: {
      "bertrand-drouvot": "what-skills-matter-the-most-for-database-engineering",
      "cedric-villemain": "what-are-the-criteria-at-data-bene-for-hiring-the-best",
      "elisa-usai": "do-you-see-common-points-among-the-top-players-in-your-teams",
      "flora-barriele": "what-are-some-traits-or-habits-youve-noticed-in-top-profiles",
      "franck-pachot": "you-have-over-30-years-of-experience-with-that-perspective",
      "yves-colin": "have-you-noticed-particular-traits-or-habits-among-top",
    },
  },
  {
    slug: "open-source-and-your-career",
    title: "What has open source done for your career?",
    intro: "Jobs, networks, and a way of working.",
    answers: {
      "alex-padula": "all-of-your-work-is-open-source-why",
      "bertrand-drouvot": "what-impact-does-open-source-have-on-your-work",
      "cedric-villemain": "youve-been-active-in-open-source-for-many-years-what-has",
      "cornelia-biacsics": "did-your-contributions-lead-to-this-job-or-how-did-it-happen",
      "damien-clochard": "whats-been-the-impact-of-open-source-on-your-life",
      "ege-gunes": "what-role-has-open-source-played-in-your-career",
      "matt-cornillon": "did-talks-open-doors-in-your-career",
      "mikael-francoeur": "do-you-think-open-source-is-still-a-good-path-today-to-get",
    },
  },
  {
    slug: "first-open-source-contribution",
    title: "Do you remember your first open-source contribution?",
    intro: "Where it started: patches, translations, talks.",
    answers: {
      "bertrand-drouvot": "how-did-you-get-into-open-source",
      "cedric-villemain": "do-you-remember-your-first-contribution",
      "damien-clochard": "do-you-remember-your-first-open-source-contribution",
      "ege-gunes": "do-you-remember-your-first-open-source-contribution",
      "franck-pachot": "your-first-open-source-contribution",
      "matt-cornillon": "is-that-your-way-of-contributing-to-open-source",
      "yves-colin": "do-you-also-contribute-to-open-source",
    },
  },
  {
    slug: "a-typical-day",
    title: "What does a typical day look like?",
    intro: "At Google, Microsoft, Oracle, Turso, Percona, Dalibo, Data Bene and more.",
    answers: {
      "cedric-villemain": "and-today-as-ceo-what-does-a-typical-day-look-like-for-you",
      "cornelia-biacsics": "what-does-a-typical-day-at-microsoft-look-like",
      "damien-clochard": "do-you-have-a-typical-day",
      "ege-gunes": "how-does-a-typical-day-go-as-a-team-lead",
      "elisa-usai": "what-does-a-typical-day-as-senior-delivery-manager-consist",
      "flora-barriele": "what-does-a-typical-day-at-oracle-look-like",
      "franck-pachot": "since-yugabyte-you-have-been-a-developer-advocate-what-is",
      "matt-cornillon": "what-does-a-typical-day-at-google-look-like",
      "mikael-francoeur": "what-does-a-typical-day-look-like-at-turso-today",
      "yves-colin": "whats-a-typical-day-like-as-a-customer-engineer-at-google",
    },
  },
  {
    slug: "books-and-resources",
    title: "Which books would you recommend?",
    intro: "Their reading lists, from database internals to novels.",
    answers: {
      "alex-padula": "do-you-have-any-book-recommendations",
      "cedric-villemain": "do-you-read-tech-books",
      "cornelia-biacsics": "on-the-personal-side-are-there-any-books-or-resources-youd",
      "damien-clochard": "are-there-resources-books-blogs-that-helped-you-master",
      "ege-gunes": "can-you-share-your-three-favorite-books",
      "elisa-usai": "is-there-a-book-or-resource-that-particularly-shaped-you",
      "flora-barriele": "a-few-books-that-helped-you",
      "franck-pachot": "do-you-have-any-books-to-recommend",
      "matt-cornillon": "are-there-resources-that-helped-you-a-lot",
      "mikael-francoeur": "do-you-have-a-top-3-books",
      "yves-colin": "outside-of-your-studies-were-there-resources-that-helped-you",
    },
  },
  {
    slug: "free-time",
    title: "How do you spend your free time?",
    intro: "Life away from the keyboard.",
    answers: {
      "alex-padula": "how-do-you-spend-your-free-time",
      "bertrand-drouvot": "how-do-you-spend-your-free-time",
      "cedric-villemain": "how-do-you-spend-your-free-time-outside-of-databases",
      "cornelia-biacsics": "how-do-you-spend-your-free-time",
      "damien-clochard": "outside-of-tech-how-do-you-spend-your-time",
      "ege-gunes": "how-do-you-spend-your-free-time",
      "elisa-usai": "how-do-you-spend-your-free-time",
      "flora-barriele": "how-do-you-spend-your-free-time",
      "franck-pachot": "how-do-you-spend-your-free-time",
      "mikael-francoeur": "how-do-you-spend-your-free-time",
      "yves-colin": "how-do-you-spend-your-free-time",
    },
  },
];

export type Answer = { interview: Interview; id: string; question: string; excerpt: string };

// Each topic with its answers, newest interview first. Interviews not published
// yet (no .mdx) are skipped.
export const getTopics = async () => {
  const interviews = await getInterviews();
  return TOPICS.map((topic) => {
    const answers: Answer[] = [];
    for (const interview of interviews) {
      const id = topic.answers[interview.slug];
      if (!id) continue;
      const question = questionsOf(interview.entry.body ?? "").find((q) => q.id === id);
      if (!question) throw new Error(`questions.ts, ${topic.slug}: no question #${id} in ${interview.slug}.mdx`);
      answers.push({ interview, id, question: question.title, excerpt: excerpt(question.answer) });
    }
    return { ...topic, answers };
  });
};

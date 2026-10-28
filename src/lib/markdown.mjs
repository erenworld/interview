import GithubSlugger, { slug } from "github-slugger";

// Question anchors (#where-did-you-grow-up): the question's slug, cut at a word
// boundary so links to a question stay short. Existing links rely on these ids.
const MAX_ID_LENGTH = 60;

// `seen` is a GithubSlugger shared by the questions of one interview (repeats get -1, -2…).
export const questionId = (seen, text) => {
  let id = slug(text);
  if (id.length > MAX_ID_LENGTH) id = id.slice(0, MAX_ID_LENGTH + 1).replace(/-[^-]*$/, "");
  return seen.slug(id);
};

export const questionIds = () => {
  const seen = new GithubSlugger();
  return {
    name: "question-ids",
    element: {
      filter: ["h2"],
      visit(node, ctx) {
        if (typeof node.properties?.id === "string") return;
        ctx.setProperty(node, "id", questionId(seen, ctx.textContent(node)));
      },
    },
  };
};

// Links to other sites open in a new tab.
export const externalLinks = {
  name: "external-links",
  element: {
    filter: ["a"],
    visit(node, ctx) {
      if (!/^https?:/.test(String(node.properties?.href))) return;
      ctx.setProperty(node, "target", "_blank");
      ctx.setProperty(node, "rel", "noreferrer");
    },
  },
};

import type { HowToPlayEntry } from "./types";

function howToPlayToText(entries: HowToPlayEntry[]): string {
  return entries
    .map((e) => [e.label, e.note].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join(". ");
}

export type FaqLatestResult = {
  year: number;
  champion: string;
  score?: string;
  runnerUp?: string;
};

/**
 * FAQPage for a tournament hub. Every answer must also be visible on the page
 * (hero dates and venue, results, how to play, event facts).
 *
 * `when` and `latestResult` are optional: hubs that pass neither keep the
 * original behavior of emitting nothing without how-to-play entries.
 */
export function buildFaqLd(t: {
  name: string;
  howToPlay?: HowToPlayEntry[];
  format?: string;
  eligibility?: string;
  /** A full sentence answering when and where, e.g. "The 2026 X is June 15-18, 2026 at Y." */
  when?: string;
  latestResult?: FaqLatestResult;
}) {
  const hasHowToPlay = Boolean(t.howToPlay && t.howToPlay.length > 0);
  if (!hasHowToPlay && !t.when && !t.latestResult) return null;

  const mainEntity: Array<Record<string, unknown>> = [];

  if (t.when) {
    mainEntity.push({
      "@type": "Question",
      name: `When and where is the ${t.name}?`,
      acceptedAnswer: { "@type": "Answer", text: t.when },
    });
  }

  if (t.latestResult) {
    const { year, champion, score, runnerUp } = t.latestResult;
    mainEntity.push({
      "@type": "Question",
      name: `Who won the ${year} ${t.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text:
          `${champion} won the ${year} ${t.name}${score ? ` (${score})` : ""}.` +
          (runnerUp ? ` ${runnerUp} finished runner-up.` : ""),
      },
    });
  }

  if (t.howToPlay && t.howToPlay.length > 0) {
    mainEntity.push({
      "@type": "Question",
      name: `How do I play in the ${t.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: howToPlayToText(t.howToPlay),
      },
    });
  }

  if (t.format) {
    mainEntity.push({
      "@type": "Question",
      name: `What is the format of the ${t.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: t.format,
      },
    });
  }

  if (t.eligibility) {
    mainEntity.push({
      "@type": "Question",
      name: `What are the eligibility requirements for the ${t.name}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: t.eligibility,
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

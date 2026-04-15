import { PROCESS_TEMPLATES, ProcessTemplate } from "./templates";

/**
 * Attempt to find a matching template for a given process candidate.
 *
 * Scoring is simple keyword overlap — good enough for v1.
 * When web search is added, pass the search result text as `extraContext`
 * and the scorer will factor it in automatically.
 *
 * Returns the best matching template and a 0–1 confidence score,
 * or null if no template scores above the threshold.
 */
export function matchTemplate(
  processId: string,
  description: string,
  extraContext?: string
): { template: ProcessTemplate; score: number } | null {
  const haystack = [description, extraContext ?? "", processId]
    .join(" ")
    .toLowerCase();

  let best: { template: ProcessTemplate; score: number } | null = null;

  for (const template of PROCESS_TEMPLATES) {
    // Exact ID match is highest confidence
    if (template.id === processId) {
      return { template, score: 0.95 };
    }

    // Keyword overlap score
    const hits = template.keywords.filter((kw) =>
      haystack.includes(kw.toLowerCase())
    ).length;

    const score = hits / template.keywords.length;

    if (!best || score > best.score) {
      best = { template, score };
    }
  }

  // Only return a match when confidence is meaningful
  if (best && best.score >= 0.3) return best;
  return null;
}

/**
 * Cheap pre-clean before the LLM:
 * - collapse runaway repeated letters (cartttttt → cart)
 * - trim / squash spaces
 * Real spelling correction still comes from the LLM.
 */
export function normalizeRepeatedLetters(text: string): string {
  return text
    .replace(/(.)\1{2,}/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

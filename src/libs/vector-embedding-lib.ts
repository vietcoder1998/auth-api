/**
 * Mock embed function: returns a deterministic vector and token count for a given string.
 * Replace with your real embedding logic or API call.
 */
export async function embed(text: string): Promise<{ vector: [number, number, number][]; tokens: number }> {
  try {
    // Main embedding logic: generate a 3-number vector for each word
    const words = text.trim().split(/\s+/);
    const vector: [number, number, number][] = words.map(word => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      return [
        (hash % 1000) / 1000,
        ((hash >> 3) % 1000) / 1000,
        ((hash >> 7) % 1000) / 1000,
      ];
    });
    const tokens = words.length;
    return { vector, tokens };
  } catch (err) {
    // Fallback: use word length for each word
    const words = text.trim().split(/\s+/);
    const vector: [number, number, number][] = words.map(w => [w.length / 10, 0, 0]);
    return { vector, tokens: words.length };
  }
}
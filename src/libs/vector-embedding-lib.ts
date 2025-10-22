/**
 * Mock embed function: returns a deterministic vector and token count for a given string.
 * Replace with your real embedding logic or API call.
 */
export async function embed(text: string): Promise<{ vector: number[]; tokens: number }> {
  // Simple deterministic hash to vector for demo purposes
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  // Return a vector of 3 numbers based on the hash
  const vector = [
    (hash % 1000) / 1000,
    ((hash >> 3) % 1000) / 1000,
    ((hash >> 7) % 1000) / 1000,
  ];
  // Token count: simple word count
  const tokens = text.trim().split(/\s+/).length;
  return { vector, tokens };
}
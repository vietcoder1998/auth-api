import { embed } from '../libs/vector-embedding-lib';

export async function convertToVector(content: string): Promise<{ vector: string; tokens: number }> {
  const { vector, tokens } = await embed(content);
  return { vector: JSON.stringify(vector), tokens };
}
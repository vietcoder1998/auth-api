import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export interface RedisVector {
  vectorId: string;
  embedding: number[];
  message: string;
  similarity: number;
}

export class VectorService {
  private genAI: GoogleGenerativeAI;
  private redisClient;

  constructor() {
    // GoogleGenerativeAI expects the API key string directly
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY || '');
    this.redisClient = createClient({ url: REDIS_URL });
    this.redisClient.connect().catch(console.error);
  }

  /**
   * Save a message embedding to Redis (vector DB)
   * @param message The message to save
   * @param options Optional config (e.g. db index, collection name)
   * @returns RedisVector object if saved, otherwise null
   */
  async saveMessage(
    message: string,
    options?: { dbIndex?: number; collection?: string },
  ): Promise<RedisVector | null> {
    try {
      // Get embedding from Google GenAI
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(message);
      // Normalize ContentEmbedding to number[]
      const embedding = Array.isArray(result.embedding)
        ? (result.embedding as number[])
        : ((result.embedding as any).values ?? (result.embedding as any).data ?? (result.embedding as any).value ?? (result.embedding as any).embedding ?? (result.embedding as any)) as number[];

      // Optionally select Redis DB index
      if (typeof options?.dbIndex === 'number') {
        await this.redisClient.select(options.dbIndex);
      }

      // Save embedding to Redis as a JSON string
      const key =
        (options?.collection || 'embeddings') +
        ':' +
        Date.now().toString();
      await this.redisClient.set(key, JSON.stringify({ message, embedding }));

      console.log('Saved embedding to Redis:', key);
      // Return RedisVector object
      return {
        vectorId: key,
        embedding,
        message,
        similarity: 1, // similarity is 1 for the saved message itself
      };
    } catch (error) {
      console.error('Error saving message to Redis vector DB:', error);
      return null;
    }
  }

  /**
   * Save an embedding directly to Redis (vector DB)
   * @param embedding The embedding to save
   * @param message The original message (optional, for reference)
   * @param options Optional config (e.g. db index, collection name)
   */
  async saveEmbedding(
    embedding: number[],
    message: string = '',
    options?: { dbIndex?: number; collection?: string }
  ): Promise<boolean> {
    try {
      if (typeof options?.dbIndex === 'number') {
        await this.redisClient.select(options.dbIndex);
      }
      const key =
        (options?.collection || 'embeddings') +
        ':' +
        Date.now().toString();
      await this.redisClient.set(key, JSON.stringify({ message, embedding }));
      console.log('Saved embedding to Redis:', key);
      return true;
    } catch (error) {
      console.error('Error saving embedding to Redis vector DB:', error);
      return false;
    }
  }

  /**
   * Find messages in Redis vector DB with similar embeddings (cosine similarity)
   * @param embedding The embedding to compare
   * @param options Optional config (e.g. db index, collection name, threshold)
   * @returns Array of matching messages with similarity score
   */
  async findSameVectorDb(
    embedding: number[],
    options?: { dbIndex?: number; collection?: string; threshold?: number }
  ): Promise<RedisVector[]> {
    const collection = options?.collection || 'embeddings';
    const threshold = typeof options?.threshold === 'number' ? options.threshold : 0.85;
    try {
      if (typeof options?.dbIndex === 'number') {
        await this.redisClient.select(options.dbIndex);
      }

      // Get all keys for the collection
      const keys = await this.redisClient.keys(`${collection}:*`);
      const results: RedisVector[] = [];

      for (const key of keys) {
        const value = await this.redisClient.get(key);
        if (!value) continue;
        const { message, embedding: storedEmbedding } = JSON.parse(value);

        // Compute cosine similarity
        const similarity = this.cosineSimilarity(embedding, storedEmbedding);
        if (similarity >= threshold) {
          results.push({
            vectorId: key,
            embedding: storedEmbedding,
            message,
            similarity,
          });
        }
      }

      // Sort by similarity descending
      results.sort((a, b) => b.similarity - a.similarity);
      return results;
    } catch (error) {
      console.error('Error finding similar vectors in Redis:', error);
      return [];
    }
  }

  async findSameVectorFromMessage(
    message: string,
    options?: { dbIndex?: number; collection?: string; threshold?: number }
  ): Promise<RedisVector[]> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(message);
      // Normalize ContentEmbedding to number[]
      const embedding = Array.isArray(result.embedding)
        ? (result.embedding as number[])
        : ((result.embedding as any).values ?? (result.embedding as any).data ?? (result.embedding as any).value ?? (result.embedding as any).embedding ?? (result.embedding as any)) as number[];
      return await this.findSameVectorDb(embedding, options);
    } catch (error) {
      console.error('Error finding similar vectors from message:', error);
      return [];
    }
  }

  /**
   * Remove vector data from Redis by key/id
   * @param id The Redis key to remove (e.g., embeddings:timestamp)
   * @param options Optional config (e.g. db index, collection name)
   */
  async removeVectorDataById(
    id: string,
    options?: { dbIndex?: number }
  ): Promise<boolean> {
    try {
      if (typeof options?.dbIndex === 'number') {
        await this.redisClient.select(options.dbIndex);
      }
      const result = await this.redisClient.del(id);
      return result > 0;
    } catch (error) {
      console.error('Error removing vector data from Redis:', error);
      return false;
    }
  }

  /**
   * Fetch vector info for a list of vectorIds from Redis.
   * @param vectorIds Array of vectorId strings
   * @returns Array of { vectorId, embedding } objects (missing ones will be null)
   */
  async getVectorsByIds(vectorIds: string[]): Promise<Array<{ vectorId: string; embedding: number[] } | null>> {
    return Promise.all(
      vectorIds.map(async (vectorId) => {
        const value = await this.redisClient.get(vectorId);
        if (value) {
          const parsed = JSON.parse(value);
          return {
            vectorId,
            embedding: parsed.embedding,
          };
        }
        return null;
      })
    );
  }

  /**
   * Fetch a single vector info from Redis by vectorId.
   * @param vectorId The Redis key for the vector
   * @returns { vectorId, embedding } or null if not found
   */
  async getVectorById(vectorId: string): Promise<{ vectorId: string; embedding: number[] } | null> {
    const value = await this.redisClient.get(vectorId);
    if (value) {
      const parsed = JSON.parse(value);
      return {
        vectorId,
        embedding: parsed.embedding,
      };
    }
    return null;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return normA && normB ? dot / (normA * normB) : 0;
  }
}

export const vectorService = new VectorService();

import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { logInfo } from '../middlewares/logger.middle';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

export interface LLMResponse {
  content: string;
  tokens: number;
  model: string;
  processingTime: number;
  metadata?: any;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMService {
  async generateResponse(
    messages: LLMMessage[],
    agentConfig: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {},
  ): Promise<LLMResponse> {
    const startTime = Date.now();

    try {
      const model = agentConfig.model || 'gpt-3.5-turbo';
      const temperature = agentConfig.temperature ?? 0.7;
      const maxTokens = agentConfig.maxTokens ?? 1000;

      // Prepare messages for OpenAI
      const preparedMessages: LLMMessage[] = [];
      if (agentConfig.systemPrompt) {
        preparedMessages.push({
          role: 'system',
          content: agentConfig.systemPrompt,
        });
      }
      preparedMessages.push(...messages);

      const response = await client.chat.completions.create({
        model,
        messages: preparedMessages,
        temperature,
        max_tokens: maxTokens,
      });

      const processingTime = Date.now() - startTime;
      const choice = response.choices[0];
      const content = choice?.message?.content ?? '';
      const finishReason = choice?.finish_reason ?? null;

      return {
        content,
        tokens: response.usage?.total_tokens ?? 0,
        model: response.model,
        processingTime,
        metadata: {
          promptTokens: response.usage?.prompt_tokens,
          completionTokens: response.usage?.completion_tokens,
          finishReason,
        },
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      return {
        content: error instanceof Error ? error.message : String(error),
        tokens: 0,
        model: 'error',
        processingTime: Date.now() - startTime,
        metadata: { isError: true },
      };
    }
  }

  /**
   * Generate response for conversation with context
   */
  async generateConversationResponse(
    conversationId: string,
    userMessage: string,
    agentId: string,
  ): Promise<LLMResponse> {
    try {
      // Get agent configuration
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          memories: {
            where: { type: 'long_term' },
            orderBy: { importance: 'desc' },
            take: 5, // Get top 5 important memories
          },
        },
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Get recent conversation history
      const recentMessages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 messages
      });

      // Parse agent config
      const config = agent.config ? JSON.parse(agent.config) : {};
      const personality = agent.personality ? JSON.parse(agent.personality) : {};

      // Build system prompt with personality and memories
      let systemPrompt = agent.systemPrompt || 'You are a helpful AI assistant.';

      if (personality.traits) {
        systemPrompt += `\n\nPersonality traits: ${personality.traits.join(', ')}`;
      }

      if (agent.memories.length > 0) {
        const memoryContext = agent.memories.map((m) => m.content).join('\n');
        systemPrompt += `\n\nRelevant memories:\n${memoryContext}`;
      }

      // Build conversation messages
      const messages: LLMMessage[] = [];

      // Add recent conversation history (reverse to get chronological order)
      recentMessages.reverse().forEach((msg) => {
        if (msg.sender === 'user') {
          messages.push({ role: 'user', content: msg.content });
        } else if (msg.sender === 'agent') {
          messages.push({ role: 'assistant', content: msg.content });
        }
      });

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      // Generate response
      return await this.generateResponse(messages, {
        model: agent.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemPrompt,
      });
    } catch (error) {
      console.error('Generate conversation response error:', error);
      return this.generateMockResponse();
    }
  }

  /**
   * Generate mock response when API is not available
   */
  private generateMockResponse(): LLMResponse {
    const responses = [
      "I understand what you're saying. Let me help you with that.",
      "That's an interesting question. Based on my knowledge, I would suggest...",
      "I see your point. Here's how I would approach this situation...",
      'Thank you for asking. Let me provide you with some insights on this topic.',
      "I appreciate you sharing that with me. Here's my perspective...",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      content:
        randomResponse +
        ' (Note: This is a mock response. Configure OPENAI_API_KEY for real AI responses.)',
      tokens: Math.floor(Math.random() * 100) + 50,
      model: 'mock-model',
      processingTime: Math.floor(Math.random() * 2000) + 500,
      metadata: {
        isMock: true,
      },
    };
  }

  /**
   * Summarize conversation for memory storage
   */
  async summarizeConversation(conversationId: string): Promise<string> {
    try {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
      });

      if (messages.length === 0) {
        return '';
      }

      const conversationText = messages.map((msg) => `${msg.sender}: ${msg.content}`).join('\n');

      const summaryResponse = await this.generateResponse(
        [
          {
            role: 'user',
            content: `Please summarize this conversation in 2-3 sentences:\n\n${conversationText}`,
          },
        ],
        {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 150,
        },
      );

      return summaryResponse.content;
    } catch (error) {
      console.error('Summarize conversation error:', error);
      return 'Conversation summary unavailable';
    }
  }
}

export const llmService = new LLMService();

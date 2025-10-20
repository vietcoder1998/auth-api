import { PrismaClient } from '@prisma/client';
import { logInfo } from '../middlewares/logger.middle';

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
  private apiKey: string;
  private baseUrl: string;
  private isApiConnected: boolean = false;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    // Ping OpenAI API on initialization
    this.pingOpenAI();
  }

  /**
   * Ping OpenAI API to test connection
   */
  private async pingOpenAI(): Promise<void> {
    try {
      if (!this.apiKey) {
        console.log('⚠️  OpenAI API key not configured');
        this.isApiConnected = false;
        return;
      }

      console.log('🔄 Testing OpenAI API connection...');

      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const modelCount = data.data?.length || 0;
        console.log(`✅ OpenAI API connected successfully! Available models: ${modelCount}`);
        this.isApiConnected = true;
      } else {
        console.error(`❌ OpenAI API connection failed: ${response.status} ${response.statusText}`);
        this.isApiConnected = false;
      }
    } catch (error) {
      console.error('❌ OpenAI API ping failed:', error instanceof Error ? error.message : error);
      this.isApiConnected = false;
    }
  }

  /**
   * Get API connection status
   */
  isConnected(): boolean {
    return this.isApiConnected;
  }

  /**
   * Generate AI response using OpenAI API
   */
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
      // If API is not connected, return mock response
      if (!this.isApiConnected) {
        console.log('OpenAI API not connected, returning mock response');
        return this.generateMockResponse();
      }

      const model = 'gpt-3.5-turbo';
      const temperature = agentConfig.temperature || 0.7;
      const maxTokens = agentConfig.maxTokens || 1000;

      // Prepare messages with system prompt
      const preparedMessages: LLMMessage[] = [];

      if (agentConfig.systemPrompt) {
        preparedMessages.push({
          role: 'system',
          content: agentConfig.systemPrompt,
        });
      }

      preparedMessages.push(...messages);
      logInfo(model);
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: preparedMessages,
          temperature,
          max_tokens: maxTokens,
          stream: false,
        }),
      });

      logInfo('GPT response', response);

      if (!response.ok) {
        // Save error message to DB as agent message
        const errorMsg = `AI Error: ${response.status} ${response.statusText}`;
        if (messages && messages.length > 0) {
          // Try to get conversationId and agentId from context if possible
          // (Assume last message has conversationId and agentId in real use)
          // This is a placeholder; adapt as needed for your actual message structure
          const conversationId = (messages as any)[0]?.conversationId;
          const agentId = (messages as any)[0]?.agentId;
          if (conversationId && agentId) {
            await prisma.message.create({
              data: {
                conversationId,
                sender: 'agent',
                content: errorMsg,
                agentId,
                isError: true,
              },
            });
          }
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        content: data.choices[0].message.content,
        tokens: data.usage.total_tokens,
        model: data.model,
        processingTime,
        metadata: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          finishReason: data.choices[0].finish_reason,
        },
      };
    } catch (error) {
      console.error('LLM Service error:', error);
      // Save error message to DB as agent message (fallback)
      if (messages && messages.length > 0) {
        const conversationId = (messages as any)[0]?.conversationId;
        const agentId = (messages as any)[0]?.agentId;
        if (conversationId && agentId) {
          await prisma.message.create({
            data: {
              conversationId,
              sender: 'agent',
              content: error instanceof Error ? error.message : String(error),
              agentId,
              isError: true,
            },
          });
        }
      }
      // Return error as AI response
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

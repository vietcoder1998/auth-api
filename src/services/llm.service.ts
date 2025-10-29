import { MemoryService } from './memory.service';
import { vectorService } from './vector.service';
import { MessageRepository } from '../repositories';
import { PrismaClient } from '@prisma/client';
import { GPTService } from './gpt.service';
import { CloudService } from './cloude.service';
import { GEMINI_API_KEY, GEMINI_API_URL, LLM_CLOUD_API_KEY, LLM_CLOUD_API_URL } from '../env';
import { logger, logInfo } from '../middlewares/logger.middle';
import { GeminiService } from './gemini.service';

export interface AgentConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  modelType?: string;
  cloudApiUrl?: string;
  geminiApiUrl?: string;
  [key: string]: any;
}


const prisma = new PrismaClient();

export interface LLMResponse {
  content: string;
  tokens: number;
  model: string;
  processingTime: number;
  metadata?: any;
  debug?: any;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponseWithVectors extends LLMResponse {
  questionVector?: any;
  answerVector?: any;
  memory?: any;
}

export class LLMService {
  private readonly messageRepository = new MessageRepository();
  
  constructor() {
    // Optionally, you can fetch enabled Gemini models here and store if needed
    // Example:
    // GeminiService.pingEnabledGeminiModels(this.geminiConfig).then(models => {
    //   this.enabledGeminiModels = models;
    // });
  }

  // Helper to determine model type
  private getModelType(type?: string): string {
    const supported = ['gpt', 'gemini', 'cloud'];
    if (type && supported.includes(type)) return type;
    return 'gpt';
  }
  // Default config for cloud and gemini endpoints
  private readonly cloudConfig = {
    apiUrl: LLM_CLOUD_API_URL || 'https://api.llmcloud.example.com/v1/chat',
    apiKey: LLM_CLOUD_API_KEY || '',
    timeout: 20000, // ms
    headers: {
      'Content-Type': 'application/json',
      // You can add Authorization or other headers here
    },
  };

  private readonly geminiConfig = {
    apiUrl: GEMINI_API_URL || 'https://api.gemini.example.com/v1/chat',
    apiKey: GEMINI_API_KEY || '',
    timeout:20000, // ms
    headers: {
      'Content-Type': 'application/json',
      // You can add Authorization or other headers here
    },
  };

  // Call LLM Cloud via CloudService
  private async callLLMCloud(
    messages: LLMMessage[],
    agentConfig: AgentConfig,
    aiKey?: string | null,
  ): Promise<LLMResponse> {
    return await CloudService.callLLMCloud(messages, agentConfig, this.cloudConfig, aiKey);
  }

  // ...existing code...

  // Call Gemini via GeminiService
  private async callGemini(
    messages: LLMMessage[],
    agentConfig: AgentConfig,
    aiKey?: string | null,
  ): Promise<LLMResponse> {
    return await GeminiService.callGemini(messages, agentConfig, this.geminiConfig, aiKey);
  }

  // Call GPT via GPTService
  private async callGPT(
    messages: LLMMessage[],
    agentConfig: AgentConfig,
    aiKey?: string | null,
  ): Promise<LLMResponse> {
    return await GPTService.callGPT(messages, agentConfig, aiKey);
  }
  /**
   * Generate a debug response for error cases, including axios error message if available
   */
  /**
   * Generate response using agentId (fetches key and model)
   */
  async generateResponseByAgentId(
    messages: LLMMessage[],
    agentId: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    } = {},
  ): Promise<LLMResponse> {
    try {
      // Find key and model for agent
      const aiKey = await this.getApiKeyByAgentId(agentId);
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: { model: true },
      });
      const model =
        typeof agent?.model === 'string' ? agent.model : agent?.model?.name || 'gpt-3.5-turbo';
      const modelType = agent?.model?.type || 'gpt';
      return await this.generateResponse(
        messages,
        {
          model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          systemPrompt: options.systemPrompt,
          modelType,
        },
        aiKey,
      );
    } catch (error) {
      return {
        content: error instanceof Error ? error.message : String(error),
        tokens: 0,
        model: 'error',
        processingTime: 0,
        metadata: { isError: true },
      };
    }
  }
  /**
   * Fetch API key for agent by agentId
   */
  async getApiKeyByAgentId(agentId: string): Promise<string | null> {
    try {
      // Find the first active AIKey linked to the agent via AIKeyAgent
      const aiKeyAgent = await prisma.aIKeyAgent.findFirst({
        where: {
          agentId,
          aiKey: {
            isActive: true,
          },
        },
        include: {
          aiKey: true,
        },
      });
      return aiKeyAgent?.aiKey ? aiKeyAgent.aiKey.key : null;
    } catch (error) {
      // Improved error typing: always return null, but log error
      logInfo('Error fetching API key for agent:', error);
      return null;
    }
  }

  // F

  async generateResponse(
    messages: LLMMessage[],
    agentConfig: AgentConfig = {},
    aiKey?: string | null,
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    try {
      // Switch by model type (from agentConfig.modelType)
      const modelType = this.getModelType(agentConfig.modelType);
      console.log(modelType);
      switch (modelType) {
        case 'gpt':
          return await this.callGPT(messages, agentConfig, aiKey);
        case 'gemini':
          return await this.callGemini(messages, agentConfig, aiKey);
        case 'cloud':
          return await this.callLLMCloud(messages, agentConfig, aiKey);
        default:
          return this.generateMockResponse();
      }
    } catch (error) {
      logger.error('LLM Cloud call error:', error);
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
      const aiKey = await this.getApiKeyByAgentId(agentId);
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
        include: {
          memories: {
            where: { type: 'long_term' },
            orderBy: { importance: 'desc' },
            take: 5,
          },
          model: true,
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
      // Pass modelType from agent.model.type if available
      const modelType = (agent.model?.type || 'gpt')?.toLowerCase();
      return await this.generateResponse(
        messages,
        {
          model:
            typeof agent.model === 'string' ? agent.model : agent?.model?.name || 'gpt-3.5-turbo',
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          systemPrompt,
          modelType,
        },
        aiKey,
      );
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

  // import { MessageService } from './message.service'; // Uncomment if MessageService exists
  /**
   * Full process: generate answer, embed, save to memory/message, link answer to question
   * @param conversationId Conversation ID
   * @param userMessage User's question
   * @param agentId Agent ID
   * @returns LLMResponse with additional context
   */
  async processAndSaveConversation(
    conversationId: string,
    userMessage: string,
    agentId: string,
  ): Promise<LLMResponseWithVectors> {
    // 1. Generate answer
    const llmResponse = await this.generateConversationResponse(
      conversationId,
      userMessage,
      agentId,
    );
    // 2. Save question embedding
    const questionVector = await vectorService.saveMessage(userMessage);
    // 3. Save answer embedding
    const answerVector = await vectorService.saveMessage(llmResponse.content);
    // 4. Save to memory (link answer to question) only if not error
    let memory = null;
    if (llmResponse.model !== 'error') {
      memory = await MemoryService.create({
        agentId,
        content: llmResponse.content,
        type: 'long_term',
        vectorId: answerVector?.vectorId,
        conversationId,
      });
    }
    // 5. Save answer message and link to question (if MessageService exists)
    const message = await this.messageRepository.create({
      conversationId,
      content: llmResponse.content,
      sender: 'agent',
      linkedQuestionVectorId: questionVector?.vectorId,
    });
    return {
      ...llmResponse,
      questionVector,
      answerVector,
      memory,
      // message,
    };
  }
}

export const llmService = new LLMService();

import OpenAI from 'openai';

export class GPTService {
  static async callGPT(messages: any[], agentConfig: any, aiKey?: string | null): Promise<any> {
    const startTime = Date.now();
    const preparedMessages: any[] = [];
    if (agentConfig.systemPrompt) {
      preparedMessages.push({ role: 'system', content: agentConfig.systemPrompt });
    }
    preparedMessages.push(...messages);
    try {
      const openaiClient = new OpenAI({
        apiKey: aiKey || process.env.OPENAI_API_KEY,
      });
      const requestPayload = {
        model: agentConfig.model,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.maxTokens,
        systemPrompt: agentConfig.systemPrompt,
        messages: preparedMessages,
      };
      const response = await openaiClient.chat.completions.create(requestPayload);
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
        debug: {
          request: requestPayload,
          response,
          llmServiceModel: 'gpt',
        },
      };
    } catch (error: any) {
      let message = error instanceof Error ? error.message : String(error);
      if (error?.response?.data?.error?.message) {
        message = error.response.data.error.message;
      }
      return {
        content: message,
        model: 'error',
        tokens: 0,
        processingTime: Date.now() - startTime,
        metadata: { isError: true },
        debug: {
          error: message,
          llmServiceModel: 'gpt',
        },
      };
    }
  }
}

export default GPTService;

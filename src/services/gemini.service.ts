import axios from 'axios';

export class GeminiService {
  /**
   * Convert Gemini API response to plain string content
   * @param responseArr Gemini response array
   * @returns string content
   */
  static extractContent(responseArr: any[]): string {
    if (!Array.isArray(responseArr) || responseArr.length === 0) return '';
    // Find first item with content.parts and text
    for (const item of responseArr) {
      if (
        item?.content?.parts &&
        Array.isArray(item.content.parts) &&
        item.content.parts.length > 0 &&
        typeof item.content.parts[0].text === 'string'
      ) {
        return item.content.parts[0].text;
      }
    }
    return '';
  }

  /**
   * Main Gemini API call, similar to LLMService.callGPT/callLLMCloud
   */
  static async callGemini(messages: any[], agentConfig: any, geminiConfig: any, aiKey?: string | null): Promise<any> {
    const startTime = Date.now();
    try {
      const url = GeminiService.getGeminiUrl(agentConfig, geminiConfig);
      const adaptedConfig = agentConfig; // Optionally adapt config if needed
      const requestPayload = GeminiService.generateGeminiBody(messages, adaptedConfig);
      const requestHeaders = {
        ...geminiConfig.headers,
        // Optionally add Authorization if needed
      };
      const response = await axios.post(url, requestPayload, {
        headers: requestHeaders,
        timeout: geminiConfig.timeout,
      });
      const content = GeminiService.extractContent(
        response.data?.candidates || response.data?.data || response.data,
      );
      return {
        ...response.data,
        content,
        tokens: response.data?.usage?.total_tokens ?? 0,
        model: agentConfig.model || 'gemini',
        processingTime: Date.now() - startTime,
        metadata: {
          promptTokens: response.data?.usage?.prompt_tokens,
          completionTokens: response.data?.usage?.completion_tokens,
        },
        debug: {
          request: { url, payload: requestPayload, headers: requestHeaders },
          response: response.data,
          llmServiceModel: 'gemini',
          adaptedConfig,
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
          llmServiceModel: 'gemini',
        },
      };
    }
  }

  /**
   * Build Gemini endpoint URL: base + model + ":generateContent"
   */
  static getGeminiUrl(agentConfig: any, geminiConfig: any): string {
    const baseUrl = agentConfig.geminiApiUrl || geminiConfig.apiUrl;
    const model = agentConfig.model || '';
    // Ensure trailing slash if needed
    const normalizedBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    let url = `${normalizedBase}${model}:generateContent`;
    // Add ?key={token} if token is present
    const token = agentConfig.geminiApiKey || geminiConfig.apiKey;
    if (token) {
      url += `?key=${encodeURIComponent(token)}`;
    }
    return url;
  }

  /**
   * Ping Gemini API to get enabled models
   */
  static async pingEnabledGeminiModels(geminiConfig: any): Promise<string[]> {
    try {
      // Example endpoint: GET https://generativelanguage.googleapis.com/v1/models?key={API_KEY}
      const baseUrl = geminiConfig.apiUrl;
      const token = geminiConfig.apiKey;
      // Remove trailing path to get base
      const modelsUrl =
        baseUrl.replace(/\/v1\/chat$/, '/v1/models') +
        (token ? `?key=${encodeURIComponent(token)}` : '');
      const axios = await import('axios');
      const response = await axios.default.get(modelsUrl);
      if (response.data && Array.isArray(response.data.models)) {
        return response.data.models.map((m: any) => m.name);
      }
      return [];
    } catch (error) {
      // Optionally log error
      return [];
    }
  }

  /**
   * Generate Gemini API request body from messages and config
   */
  static generateGeminiBody(messages: any[], adaptedConfig: any): any {
    let promptText = '';
    if (Array.isArray(messages) && messages.length > 0) {
      // Prefer last user message, else join all
      const lastUser = messages.filter((m) => m.role === 'user').pop();
      promptText = lastUser ? lastUser.content : messages.map((m) => m.content).join('\n');
    }
    // Only include valid Gemini fields in payload
    const { model, maxTokens } = adaptedConfig;
    const payload: any = {
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
    };
    if (model) payload.model = model;
    if (maxTokens) payload.maxTokens = maxTokens;
    return payload;
  }
}

export default GeminiService;

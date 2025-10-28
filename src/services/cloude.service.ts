import axios from 'axios';

export class CloudService {
  static async callLLMCloud(messages: any[], agentConfig: any, cloudConfig: any, aiKey?: string | null): Promise<any> {
    try {
      const url = agentConfig.cloudApiUrl || cloudConfig.apiUrl;
      const requestPayload = { messages, ...agentConfig };
      const requestHeaders = {
        ...cloudConfig.headers,
        ...(aiKey
          ? { Authorization: `Bearer ${aiKey}` }
          : cloudConfig.apiKey
            ? { Authorization: `Bearer ${cloudConfig.apiKey}` }
            : {}),
      };
      const response = await axios.post(url, requestPayload, {
        headers: requestHeaders,
        timeout: cloudConfig.timeout,
      });
      return {
        ...(response.data),
        debug: {
          request: { url, payload: requestPayload, headers: requestHeaders },
          response: response.data,
          llmServiceModel: 'cloud',
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
        processingTime: Math.floor(Math.random() * 2000) + 500,
        metadata: { isError: true },
        debug: {
          error: message,
          llmServiceModel: 'cloud',
        },
      };
    }
  }
}


export const cloudService = new CloudService();
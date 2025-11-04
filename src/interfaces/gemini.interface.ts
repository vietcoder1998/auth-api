export interface GeminiServiceConfig {
  apiUrl: string;
  apiKey: string;
  defaultModel?: string;
  headers?: Record<string, string>;
  timeout?: number;
}
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
}

export default GeminiService;

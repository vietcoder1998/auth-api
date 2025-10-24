

export interface PromptContextPayload {
	input: string;
	answer: string;
	relatedAnswer?: string;
	relatedQuestion?: string;
	generatedQuestion?: string;
}

export class PromptService {
	/**
	 * Generate a context payload for an AI agent from input and optional context
	 * @param input The user input string
	 * @param options Optional context: answer, relatedAnswer, relatedQuestion
	 */
	static generateContextPayload(
		input: string,
		options?: {
			answer?: string;
			relatedAnswer?: string;
			relatedQuestion?: string;
		}
	): PromptContextPayload {
		// Generate a follow-up question (simple example)
		const generatedQuestion = `Can you provide more details about: ${input}?`;
		return {
			input,
			answer: options?.answer ?? '',
			relatedAnswer: options?.relatedAnswer ?? '',
			relatedQuestion: options?.relatedQuestion ?? '',
			generatedQuestion,
		};
	}

	/**
	 * Example method to extract answer from a raw AI response
	 */
	static extractAnswer(aiResponse: any): string {
		if (!aiResponse) return '';
		if (typeof aiResponse === 'string') return aiResponse;
		if (aiResponse.answer) return aiResponse.answer;
		if (aiResponse.content) return aiResponse.content;
		return JSON.stringify(aiResponse);
	}

	/**
	 * Example method to extract related answer from context
	 */
	static extractRelatedAnswer(context: any): string {
		if (!context) return '';
		if (context.relatedAnswer) return context.relatedAnswer;
		return '';
	}

	/**
	 * Example method to extract related question from context
	 */
	static extractRelatedQuestion(context: any): string {
		if (!context) return '';
		if (context.relatedQuestion) return context.relatedQuestion;
		return '';
	}

	/**
	 * Example method to generate a follow-up question
	 */
	static generateFollowUpQuestion(input: string): string {
		return `What else would you like to know about: ${input}?`;
	}

    
    /**
     * Utility to convert PromptContextPayload to a formatted string for AI agent context
     */
    static contextPayloadToString(payload: PromptContextPayload): string {
        let result = `Input: ${payload.input}\n`;
        result += `Answer: ${payload.answer}\n`;
        if (payload.relatedAnswer) result += `Related Answer: ${payload.relatedAnswer}\n`;
        if (payload.relatedQuestion) result += `Related Question: ${payload.relatedQuestion}\n`;
        if (payload.generatedQuestion) result += `Generated Question: ${payload.generatedQuestion}\n`;
        return result.trim();
    }
}


export const promptService = PromptService;

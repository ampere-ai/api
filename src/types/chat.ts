export type OpenAIModel = "gpt-3.5-turbo" | "gpt-4" | "gpt-3.5-turbo-16k";

export interface OpenAIMessage {
	role: "system" | "assistant" | "user";
	content: string;
}

export interface OpenAIResponseBody {
	choices: [ {
		message: OpenAIMessage;
		finish_reason: "stop" | "length";
	} ];
	
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
	};
}

export const OPENAI_PRICES = {
	"gpt-3.5-turbo": {
		input: 0.0015,
		output: 0.002
	},

	"gpt-4": {
		input: 0.03,
		output: 0.06
	},

	"gpt-3.5-turbo-16k": {
		input: 0.003,
		output: 0.004
	}
};
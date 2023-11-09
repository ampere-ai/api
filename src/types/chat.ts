import type { Emitter } from "../utils/emitter.js";
import { Plugin } from "../utils/plugins.js";

export type OpenAIModel = "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gpt-4" | "gpt-4-vision-preview";

export interface APIChatContent {
	type: string;
	text?: string;
	image_url?: {
		url: string;
		detail?: string;
	};
}

export interface OpenAIMessage {
	role: "system" | "assistant" | "user" | "tool";
	tool_call_id?: string;
	tool_calls?: OpenAIChatToolCall[];
	name?: string;
	content: string | APIChatContent[];
}

export interface OpenAIResponseBody {
	choices: [ {
		delta: OpenAIMessage;
		message: OpenAIMessage;
		finish_reason: "stop" | "length";
	} ];	
	
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
	};
}

export interface OpenAIRequestOptions {
	body: OpenAICompletionsBody;
	emitter: Emitter<any>;

	baseURL?: string;
	key?: string;

	cost: {
		input: number;
		output: number;
	};
}

export interface OpenAICompletionsBody {
	messages: OpenAIMessage[];
	max_tokens: number;
	model: string;
	temperature: number;
	tools?: OpenAIChatTool[];
}

export interface OpenAIChatTool {
	type: "function";
	function: {
		name: string;
		description?: string;
		parameters: OpenAIChatFunctionParameter;
	};
}

export interface OpenAIChatToolCall {
	index: number;
	id: string;
	type: "function";
	function: {
		name?: string;
		arguments: string;
	};
}

export interface OpenAIChatFunctionParameter {
    /** Type of the parameter */
    type: "object" | "string" | "number" | "boolean";

    /** Description of the parameter */
    description?: string;

    /** A list of allowed options for the parameter */
    enum?: string[];

    /** Properties, for an `object` parameter */
    properties?: Record<string, OpenAIChatFunctionParameter>;

    /* A list of required properties, for an `object` parameter */
    required?: string[];
}

export interface OpenAIResponse {
	content: string;
	finishReason: string | null;
	tools: {
		plugin: Plugin;
		id: string;
		data: string;
	}[];
	done: boolean;
	cost: number;
}

export const OPENAI_PRICES = {
	"gpt-3.5-turbo": {
		input: 0.0015,
		output: 0.002
	},

	"gpt-3.5-turbo-1106": {
		input: 0.0015,
		output: 0.002
	},

	"gpt-4": {
		input: 0.03,
		output: 0.06
	},

	"gpt-4-vision-preview": {
		input: 0.03,
		output: 0.06
	},
	
	"gpt-4-1106-preview": {
		input: 0.03,
		output: 0.06
	},

	"gpt-3.5-turbo-16k": {
		input: 0.003,
		output: 0.004
	}
};
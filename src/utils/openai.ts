import { fetchEventSource } from "@waylaidwanderer/fetch-event-source";

import type { OpenAIMessage } from "../types/chat.js";
import type { Emitter } from "./emitter.js";

import { getChatMessageLength, getMessageTokens } from "./tokens.js";
import { OPENAI_API_KEY } from "../config.js";
import { APIError } from "../types/error.js";

interface OpenAIRequestOptions {
	body: OpenAICompletionsBody;
	emitter: Emitter<any>;

	baseURL?: string;
	key?: string;

	cost: {
		input: number;
		output: number;
	};
}

interface OpenAICompletionsBody {
	messages: OpenAIMessage[];
	max_tokens: number;
	model: string;
	temperature: number;
}

export async function executeOpenAIRequest({ body, emitter, baseURL, key, cost }: OpenAIRequestOptions) {
	const result = {
		content: "",
		finishReason: null,
		done: false,
		cost: 0
	};

	result.cost += (
		getChatMessageLength(...body.messages) / 1000
	) * cost.input;

	await fetchEventSource(`${baseURL ?? "https://api.openai.com/v1"}/chat/completions`, {
		method: "POST",

		headers: openAIHeaders(key),
		body: JSON.stringify({ ...body, stream: true }),

		onopen: async response => {
			if (!response.ok) {
				const body = await response.json();

				throw new APIError({
					message: body.error.message, id: body.error.id, code: response.status
				});
			}
		},
		
		onerror: error => {
			throw error;
		},

		onmessage: ({ data: raw }) => {
			if (raw.length === 0) return;

			if (raw === "[DONE]") {
				result.done = true;

				result.cost += (
					getMessageTokens(result.content) / 1000
				) * cost.output;
				
				return emitter.emit(result);
			}

			const data = JSON.parse(raw);
			if (!data.choices || !data.choices[0] || !data.choices[0].delta.content) return;

			result.content += data.choices[0].delta.content;
			result.finishReason = data.choices[0].finish_reason ?? null;

			emitter.emit(result);
		}
	});
}

export function openAIHeaders(key = OPENAI_API_KEY) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${key}`
	};
}
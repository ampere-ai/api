import { fetchEventSource } from "@waylaidwanderer/fetch-event-source";

import { getChatMessageLength, getMessageTokens } from "../../utils/tokens.js";
import { type OpenAIModel, OPENAI_PRICES } from "../../types/chat.js";
import { OpenAIMessage } from "../../types/chat.js";
import { OPENAI_API_KEY } from "../../config.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "gpt",

	parameters: {
		messages: {
			type: [] as OpenAIMessage[],
			required: true
		},

		model: {
			type: "string",
			default: "gpt-3.5-turbo",

			choices: [
				"gpt-3.5-turbo",
				"gpt-3.5-turbo-16k",
				"gpt-4"
			]
		},

		maxTokens: {
			type: "number",
			default: 512
		},

		temperature: {
			type: "number",
			default: 0.9
		}
	},

	execute: async ({ messages, maxTokens, model, temperature }, emitter) => {
		const result = {
			content: "",
			finishReason: null,
			done: false,
			cost: 0
		};

		result.cost += (
			getChatMessageLength(...messages) / 1000
		) * OPENAI_PRICES[model as OpenAIModel].input;

		await fetchEventSource("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: openAIHeaders(),

			body: JSON.stringify({
				messages, max_tokens: maxTokens, model, temperature, stream: true
			}),

			onopen: async response => {
				if (!response.ok) {
					const body = await response.json();

					throw new APIError({
						message: body.error.message, code: response.status
					});
				}
			},
			
			onerror: error => {
				throw error;
			},

			onmessage: ({ data: raw }) => {
				if (raw === "[DONE]") {
					result.done = true;

					result.cost += (
						getMessageTokens(result.content) / 1000
					) * OPENAI_PRICES[model as OpenAIModel].output;
					
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
});

export function openAIHeaders() {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${OPENAI_API_KEY}`
	};
}
import { fetchEventSource } from "@waylaidwanderer/fetch-event-source";

import { OpenAIMessage } from "../../types/message.js";
import { OPENAI_API_KEY } from "../../config.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";
import { getChatMessageLength, getMessageTokens } from "../../utils/tokens.js";

type OpenAIModel = "gpt-3.5-turbo" | "gpt-4" | "gpt-3.5-turbo-16k"

const prices = {
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

export default createModel({
	name: "gpt",

	parameters: {
		messages: {
			type: [] as OpenAIMessage[],
			required: true
		},

		model: {
			type: "string",
			default: "gpt-3.5-turbo"
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
		) * prices[model as OpenAIModel].input;

		await fetchEventSource("https://api.openai.com/v1/chat/completions", {
			method: "POST",

			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},

			body: JSON.stringify({
				messages, max_tokens: maxTokens, model, temperature, stream: true
			}),

			onopen: async response => {
				if (!response.ok) {
					const body = await response.json();

					throw new APIError({
						message: body.error, code: response.status
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
					) * prices[model as OpenAIModel].output;
					
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
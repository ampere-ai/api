import { fetchEventSource } from "@waylaidwanderer/fetch-event-source";

import { OpenAIMessage } from "../../types/message.js";
import { createModel } from "../mod.js";
import { OPENAI_API_KEY } from "../../config.js";
import { APIError } from "../../types/error.js";

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
		const result: any = {
			content: "",
			finishReason: null,
			done: false,
			cost: 0
		};

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
					return emitter.emit(result);
				}

				const data = JSON.parse(raw);
				if (!data.choices || !data.choices[0] || !data.choices[0].delta.content) return;

				result.content += data.choices[0].delta.content;
				emitter.emit(result);
			}
		});
	}
});
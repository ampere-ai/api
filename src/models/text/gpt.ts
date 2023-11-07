import type { OpenAIMessage } from "../../types/chat.js";

import { executeOpenAIRequest } from "../../utils/openai.js";
import { OPENAI_PRICES } from "../../types/chat.js";
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
				"gpt-4",
				"gpt-4-vision-preview"
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
		await executeOpenAIRequest({
			body: {
				messages, max_tokens: maxTokens, model, temperature
			},
			
			cost: OPENAI_PRICES[model as keyof typeof OPENAI_PRICES],
			emitter
		});
	}
});
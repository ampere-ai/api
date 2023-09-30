import type { OpenAIMessage } from "../../types/chat.js";

import { executeOpenAIRequest } from "../../utils/openai.js";
import { DEEPINFRA_API_KEY } from "../../config.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "deepinfra",

	parameters: {
		model: {
			type: "string", required: true,

			choices: [
				"mistralai/Mistral-7B-Instruct-v0.1",
				"meta-llama/Llama-2-13b-chat-hf"
			]
		},

		messages: {
			type: [] as OpenAIMessage[],
			required: true
		},

		maxTokens: {
			type: "number",
			default: 512
		},

		temperature: {
			type: "number",
			default: 0
		}
	},

	execute: async ({ model, messages, maxTokens, temperature }, emitter) => {
		await executeOpenAIRequest({
			body: {
				messages, max_tokens: maxTokens, temperature, model
			},
			
			baseURL: "https://api.deepinfra.com/v1/openai",
			key: DEEPINFRA_API_KEY,

			cost: { input: 0.0010, output: 0.0010 },
			emitter
		});
	}
});
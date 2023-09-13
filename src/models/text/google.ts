import type { OpenAIMessage } from "../../types/chat.js";

import { MAKERSUITE_API_KEY } from "../../config.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "google",

	parameters: {
		messages: {
			type: [] as OpenAIMessage[],
			required: true
		},

		temperature: {
			type: "number",
			default: 0
		},

		model: {
			type: "string",
			choices: [ "chat-bison-001" ],
			default: "chat-bison-001"
		}
	},

	execute: async ({ messages, temperature, model }, result) => {
		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta2/models/${model}:generateMessage?key=${MAKERSUITE_API_KEY}`, {
			method: "POST",

			headers: {
				"Content-Type": "application/json"
			},

			body: JSON.stringify({
				prompt: {
					context: messages.some(m => m.role === "system")
						? messages.filter(m => m.role === "system").map(m => m.content).join("\n\n")
						: undefined,

					messages: messages.filter(m => m.role !== "system").map(m => ({
						content: m.content
					}))
				},

				temperature, model
			})
		});

		const data = await response.json();

		if (!response.ok) throw new APIError({
			message: data.error.message, code: 400
		});

		/** TODO: Implement */
		result.emit({
			content: "ok", finishReason: null, cost: 0, done: true
		});
	}
});
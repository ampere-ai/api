import { randomUUID } from "crypto";

import { openAIHeaders } from "../../utils/openai.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "openai",

	parameters: {
		model: {
			type: "string",
			choices: [ "dall-e-3" ],
			default: "dall-e-3"
		},

		prompt: {
			type: "string",
			required: true
		}
	},

	execute: async (options, emitter) => {
		const response = await fetch("https://api.openai.com/v1/images/generations", {
			method: "POST",
			headers: openAIHeaders(),

			body: JSON.stringify({
				prompt: options.prompt,
				model: options.model,
				n: 1, response_format: "b64_json"
			})
		});

		if (!response.ok) {
			const body = await response.json();

			throw new APIError({
				message: body.error.message, id: body.error.id, code: response.status
			});
		}

		const result: {
			data: { b64_json: string }[];
		} = await response.json();

		emitter.emit({
			id: randomUUID(), progress: null, cost: 0.02, done: true,

			results: await Promise.all(result.data.map(async ({ b64_json }) => ({
				id: randomUUID(), status: "success",
				data: b64_json
			})))
		});
	}
});
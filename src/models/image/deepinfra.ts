import { randomUUID } from "crypto";

import { executeDeepInfraRequest } from "../../utils/deepinfra.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "deepinfra",

	parameters: {
		prompt: {
			type: "string",
			required: true
		},

		negativePrompt: {
			type: "string"
		},

		width: {
			type: "number",
			default: 512
		},

		height: {
			type: "number",
			default: 512
		},

		steps: {
			type: "number",
			default: 30
		},

		guidance: {
			type: "number",
			default: 7
		},

		amount: {
			type: "number",
			default: 1
		},

		model: {
			type: "string",
			default: "stability-ai/sdxl",

			choices: [
				"stability-ai/sdxl", "stabilityai/stable-diffusion-2-1"
			]
		}
	},

	execute: async ({ prompt, negativePrompt, model, amount, width, height, steps, guidance }, emitter) => {
		const result = await executeDeepInfraRequest<{
			output?: string[]; images?: string[];
			error?: string;
		}>({
			model, input: {
				prompt, negative_prompt: negativePrompt,
				num_inference_steps: steps, width, height,
				guidance_scale: guidance,
				num_images: amount, num_outputs: amount
			}
		});

		/** I HATE DEEPINFRA, WHY DONT YOU HANDLE ERRORS YOURSELF */
		if (result.output === null && result.error) throw new APIError({
			message: result.error, code: 500
		});

		/* I HATE DEEPINFRA x2, WHY DONT YOU JUST USE A CONSISTENT FORMAT FOR MODEL OUTPUTS AAA */
		const images = await Promise.all([ ...result.images ?? [], ...result.output ?? [] ].map(async raw => {
			if (raw.startsWith("http")) {
				/* Download the resulting image, and convert it into Base64. */
				const data = Buffer.from(await (await fetch(raw)).arrayBuffer()).toString("base64");
				return data;

			} else {
				/* Everything else is already in Base64 data */
				return raw;
			}
		}));

		emitter.emit({
			id: result.id,
			cost: result.cost,
			done: result.done,
			progress: null,

			results: images.map(data => ({
				id: randomUUID(), status: "success", data
			}))
		});
	}
});
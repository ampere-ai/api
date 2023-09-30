import { randomUUID } from "crypto";

import { RunPodResponse, executeRPRequest } from "../../utils/runpod.js";
import { Emitter } from "../../utils/emitter.js";
import { createModel } from "../mod.js";

interface KandinskyResult {
	/** One image was requested */
	image_url?: string;

	/** Multiple images were requested */
	images?: string[];
}

export default createModel({
	name: "kandinsky",

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

		sampler: {
			type: "string",
			default: "ddim"
		},

		amount: {
			type: "number",
			default: 1
		}
	},

	execute: async (options, result) => {
		const emitter = new Emitter<RunPodResponse<KandinskyResult>>();
		
		emitter.on(async data => {
			const results: {
				id: string;
				status: string;
				data: string;
			}[] = [];

			if (data.output.image_url || data.output.images) {
				const urls = data.output.image_url ? [ data.output.image_url ] : data.output.images!;

				results.push(...await Promise.all(urls.map(async url => {
					const data = Buffer.from(
						await (await fetch(url)).arrayBuffer()
					);

					return {
						id: randomUUID(), status: "success",
						data: data.toString("base64")
					};
				})));
			}

			result.emit({
				id: data.id, cost: 0, progress: null, done: data.done,
				results
			});
		});

		await executeRPRequest({
			emitter, endpoint: "https://api.runpod.ai/v2/kandinsky-v2",

			body: {
				prompt: options.prompt,
				negative_prompt: options.negativePrompt,
				num_steps: options.steps,
				guidance_scale: options.guidance,
				h: options.height,
				w: options.width,
				sampler: options.sampler,
				prior_cf_scale: 4,
				prior_steps: "5",
				num_images: options.amount,
				seed: -1
			}
		});
	}
});
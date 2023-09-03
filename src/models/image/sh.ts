import { setTimeout as sleep } from "timers/promises";

import { APIError } from "../../types/error.js";
import { SH_API_KEY } from "../../config.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "sh",

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
			default: "k_euler"
		},

		amount: {
			type: "number",
			default: 1
		},

		model: {
			type: "string",
			default: "SDXL_beta::stability.ai#6901"
		}
	},

	execute: async (options, emitter) => {
		const initial = await startGeneration(options);

		const result: {
			id: string;
			cost: number;
			results: {
				id: string;
				status: "success" | "filtered" | "failed";
				data: string;
			}[];
			progress: number;
			done: boolean;
		} = {
			id: initial.id,
			cost: 0,
			results: [],
			progress: 0,
			done: false
		};

		const waitTime: {
			original: number | null;
			current: number;
		} = {
			original: null, current: 0
		};

		do {
			const data = await checkGeneration(result.id);

			if (data.wait_time > 0) {
				if (waitTime.original === null) waitTime.original = data.wait_time;
				waitTime.current = data.wait_time;
			}

			const percent = waitTime.original && !data.done ? Math.min(Math.max(
				(waitTime.original - waitTime.current) / waitTime.original, 0
			), 1) : 1;

			result.progress = percent;
			result.cost = calculateCost(data.kudos);
			result.done = data.done;

			if (data.generations) result.results = await Promise.all(data.generations.map(async g => {
				return {
					id: g.id, status: g.censored ? "filtered" : "success", data: g.img
				};
			}));

			emitter.emit(result);
			await sleep(7.5 * 1000);
		} while (!result.done);
	}
});

async function startGeneration(options: {
    prompt: string;
    negativePrompt: string;
    width: number;
    height: number;
    steps: number;
    guidance: number;
    sampler: string;
    amount: number;
    model: string;
}): Promise<{
	id: string;
	kudos: number;
}> {
	const body = {
		prompt: options.negativePrompt ? `${options.prompt} ### ${options.negativePrompt}` : options.prompt,
		models: [ options.model ],

		params: {
			sampler_name: options.sampler,
			cfg_scale: options.guidance,
			width: options.width,
			height: options.height,
			steps: options.steps,
			n: options.amount
		},

		shared: true, r2: false
	};

	const response = await fetch("https://stablehorde.net/api/v2/generate/async", {
		method: "POST", headers: headers(), body: JSON.stringify(body)
	});

	const data = await response.json();

	if (!response.ok) throw new APIError({
		message: data.message, code: response.status
	});

	return {
		id: data.id,
		kudos: data.kudos
	};
}

async function checkGeneration(id: string): Promise<{
	done: boolean;
	wait_time: number;
	queue_position: number;
	kudos: number;

	generations?: {
		img: string;
		id: string;
		censored: boolean;
	}[];
}> {
	const response = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
		headers: headers()
	});

	const data = await response.json();

	if (!response.ok) throw new APIError({
		message: data.message, code: response.status
	});

	return {
		done: data.done, wait_time: data.wait_time,
		queue_position: data.queue_position,
		kudos: data.kudos, generations: data.generations
	};
}

export function headers(anon?: boolean) {
	return {
		"Content-Type": "application/json",
		Accept: "application/json",
		apiKey: anon ? "0000000000" : SH_API_KEY,
		"Client-Agent": "ampere:v0.0.1:@f1nniboy"
	};
}

export function calculateCost(kudos: number) {
	return kudos / 1000;
}
import { setTimeout as sleep } from "timers/promises";

import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";
import { headers } from "./sh.js";

export default createModel({
	name: "interrogate",

	parameters: {
		url: {
			type: "string",
			required: true
		},

		model: {
			type: "string",
			default: "RealESRGAN_x4plus_anime_6B",

			choices: [
				"4x_AnimeSharp", "RealESRGAN_x2plus", "RealESRGAN_x4plus", "RealESRGAN_x4plus_anime_6B", "strip_background"
			]
		}
	},

	execute: async (options, emitter) => {
		const initial = await startGeneration(options);

		const result: {
			id: string;
			cost: number;
			result: string | null;
			done: boolean;
		} = {
			id: initial.id,
			result: null,
			done: false,
			cost: 0
		};

		do {
			const data = await checkGeneration(result.id);

			result.result = data.result;
			result.done = data.done;

			emitter.emit(result);
			await sleep(7.5 * 1000);
		} while (!result.done);
	}
});

async function startGeneration(options: {
	url: string;
	model: string;
}): Promise<{
	id: string;
	kudos: number;
}> {
	const body = {
		source_image: options.url,
		slow_workers: false,

		forms: [ {
			name: options.model
		} ]
	};

	const response = await fetch("https://stablehorde.net/api/v2/interrogate/async", {
		method: "POST", headers: headers(true), body: JSON.stringify(body)
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

async function checkGeneration(id: string) {
	const response = await fetch(`https://stablehorde.net/api/v2/interrogate/status/${id}`, {
		headers: headers(true)
	});

	const data = await response.json();

	if (!response.ok) throw new APIError({
		message: data.message, code: response.status
	});

	const form: {
		state: "waiting" | "processing" | "done";
		result: {
			[x: string]: string;
		};
	} = data.forms[0];

	const result = form.result ? Object.values(form.result)[0] : null;

	const buffer = result ? Buffer.from(await (
		await fetch(result)
	).arrayBuffer()) : null;

	return {
		result: buffer ? buffer.toString("base64") : null,
		done: form.state === "done"
	};
}
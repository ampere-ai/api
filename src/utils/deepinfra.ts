import { DEEPINFRA_API_KEY } from "../config.js";
import { APIError } from "../types/error.js";

interface DeepInfraRequestOptions {
	model: string;
	input: object;
}

interface DeepInfraInferenceStatus {
	cost: number;
	runtime_ms: number;
	tokens_generated: number | null;
	tokens_input: number | null;
	status: "succeeded";
}

export type DeepInfraResponse<T> = {
	id: string;
	status: DeepInfraInferenceStatus["status"];
	cost: number;
	time: number;
	done: boolean;
} & T;

type RawDeepInfraResponse<T> = {
	request_id: string;
	inference_status: DeepInfraInferenceStatus;
	detail?: string;
} & T;

export async function executeDeepInfraRequest<T>({
	model, input
}: DeepInfraRequestOptions): Promise<DeepInfraResponse<T>> {
	const response = await fetch(`https://api.deepinfra.com/v1/inference/${model}`, {
		method: "POST",
		
		headers: deepInfraHeaders(),
		body: JSON.stringify({ input })
	});

	const data: RawDeepInfraResponse<T> = await response.json();
	checkError(data);

	return rawToResponse(data);
}

function checkError<T>(response: RawDeepInfraResponse<T>) {
	if (response.detail) {
		throw new APIError({
			message: response.detail, code: 400
		});
	}
}

function rawToResponse<T>(raw: RawDeepInfraResponse<T>): DeepInfraResponse<T> {
	return {
		...raw,

		id: raw.request_id,
		done: raw.inference_status.status === "succeeded",
		status: raw.inference_status.status,
		cost: raw.inference_status.cost,
		time: raw.inference_status.runtime_ms
	} as DeepInfraResponse<T>;
}

function deepInfraHeaders() {
	return {
		"Content-Type": "application/json",
		Authorization: `bearer ${DEEPINFRA_API_KEY}`
	};
}
import { setTimeout as delay } from "timers/promises";

import { RUNPOD_API_KEY } from "../config.js";
import { APIError } from "../types/error.js";
import { Emitter } from "./emitter.js";

interface RunPodRequestOptions<T> {
	endpoint: string;
	emitter: Emitter<RunPodResponse<T>>;
	interval?: number;
	body: any;
}

export interface RunPodResponse<T = any> {
	status: "QUEUED" | "COMPLETED" | "FAILED";
	time: number;
	done: boolean;
	output: T;
}

interface RawRunPodResponse<T = any> {
	id: string;
	status: "QUEUED" | "COMPLETED" | "FAILED";
	executionTime: number;
	error?: string;
	output: T;
}

export async function executeRPRequest<T>({
	endpoint, body, interval, emitter
}: RunPodRequestOptions<T>) {
	let response = await startRequest<T>(endpoint, body);

	do {
		response = await checkRequest<T>(endpoint, response.id);
		await delay(interval ?? 1000);
	} while (response.status !== "COMPLETED" && response.status !== "FAILED");

	emitter.emit(rawToResponse<T>(response));
}

async function startRequest<T>(endpoint: string, body: any): Promise<RawRunPodResponse<T>> {
	const response = await fetch(`${endpoint}/run`, {
		method: "POST",
		headers: headers(),

		body: JSON.stringify({
			input: body
		}),
	});

	const data = await response.json();
	checkError(data);

	return data;
}

async function checkRequest<T>(endpoint: string, id: string): Promise<RawRunPodResponse<T>> {
	const response = await fetch(`${endpoint}/status/${id}`, {
		method: "GET", headers: headers()
	});

	const data = await response.json();
	checkError(data);

	return data;
}

function checkError<T>(response: RawRunPodResponse<T>) {
	if (response.status === "FAILED" && response.error) {
		throw new APIError({
			message: response.error, code: 400
		});
	}
}

function rawToResponse<T>(raw: RawRunPodResponse<T>): RunPodResponse<T> {
	return {
		done: raw.status === "COMPLETED",
		output: raw.output, status: raw.status,
		time: raw.executionTime
	};
}

function headers() {
	return {
		"Content-Type": "application/json",
		Authorization: RUNPOD_API_KEY
	};
}
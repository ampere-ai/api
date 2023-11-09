import { fetchEventSource } from "@waylaidwanderer/fetch-event-source";

import type { OpenAIRequestOptions, OpenAIResponse, OpenAIResponseBody } from "../types/chat.js";

import { getChatMessageLength, getMessageTokens } from "./tokens.js";
import { type Plugin, CHAT_PLUGINS } from "./plugins.js";
import { OPENAI_API_KEY } from "../config.js";
import { APIError } from "../types/error.js";

export async function executeOpenAIRequest(
	{ body, emitter, baseURL, key, cost }: OpenAIRequestOptions
): Promise<OpenAIResponse> {
	const result: OpenAIResponse = {
		content: "",
		finishReason: null,
		tools: [],
		done: false,
		cost: 0
	};

	result.cost += (
		getChatMessageLength(...body.messages) / 1000
	) * cost.input;

	fetchEventSource(`${baseURL ?? "https://api.openai.com/v1"}/chat/completions`, {
		method: "POST",

		headers: openAIHeaders(key),
		body: JSON.stringify({ ...body, stream: true }),

		onopen: async response => {
			if (!response.ok) {
				const body = await response.json();

				throw new APIError({
					message: body.error.message, id: body.error.id, code: response.status
				});
			}
		},
		
		onerror: error => {
			throw error;
		},

		onmessage: ({ data: raw }) => {
			if (raw.length === 0) return;

			if (raw === "[DONE]") {
				result.done = true;

				result.cost += (
					getMessageTokens(result.content) / 1000
				) * cost.output;
				
				return emitter.emit(result);
			}

			const data: OpenAIResponseBody = JSON.parse(raw);
			if (!data.choices || !data.choices[0]) return;

			result.content += data.choices[0].delta.content ?? "";
			result.finishReason = data.choices[0].finish_reason ?? null;
			
			if (data.choices[0].delta.tool_calls) {
				const call = data.choices[0].delta.tool_calls[0];

				if (
					!result.tools[call.index]
					&& call.function.name
					&& CHAT_PLUGINS[call.function.name as keyof typeof CHAT_PLUGINS])
				{
					result.tools[call.index] = {
						plugin: CHAT_PLUGINS[call.function.name as keyof typeof CHAT_PLUGINS] as unknown as Plugin,
						id: call.id, data: ""
					};
				} else {
					result.tools[call.index].data += call.function.arguments;
				}
			}

			emitter.emit(result);
		}
	});

	return emitter.wait();
}

export function openAIHeaders(key = OPENAI_API_KEY) {
	return {
		"Content-Type": "application/json",
		Authorization: `Bearer ${key}`
	};
}
import type { OpenAIMessage } from "../../types/chat.js";

import { type RunPodResponse, executeRPRequest } from "../../utils/runpod.js";
import { Emitter } from "../../utils/emitter.js";
import { createModel } from "../mod.js";

interface LLaMAResult {
	input_tokens: number;
	output_tokens: number;
	text: [ string ];
}

export default createModel({
	name: "llama",

	parameters: {
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

	execute: async ({ messages, maxTokens, temperature }, result) => {
		const emitter = new Emitter<RunPodResponse<LLaMAResult>>();

		emitter.on(partial => {
			const tokens = partial.output.input_tokens + partial.output.output_tokens;
			const costPerTokens = 0.00075;
			
			result.emit({
				content: partial.output.text[0],
				finishReason: null,
				cost: (tokens / 1000) * costPerTokens,
				done: partial.done
			});
		});

		let prompt = messages.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join("\n\n");
		prompt += "\n\nASSISTANT:\n";

		await executeRPRequest({
			emitter, endpoint: "https://api.runpod.ai/v2/llama2-7b-chat",
			
			body: {
				prompt,

				sampling_params: {
					max_tokens: maxTokens,
					n: 1,
					presence_penalty: 0.2,
					frequency_penalty: 0.7,
					temperature: temperature,
					stop: [ "USER", "ASSISTANT", "SYSTEM" ]
				}
			}
		});
	}
});
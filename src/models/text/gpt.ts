import { bold } from "colorette";

import { CHAT_PLUGINS, PluginResult, pluginToOpenAITool } from "../../utils/plugins.js";
import { executeOpenAIRequest } from "../../utils/openai.js";
import type { OpenAIMessage } from "../../types/chat.js";
import { OPENAI_PRICES } from "../../types/chat.js";
import { ModelData, createModel } from "../mod.js";
import { Emitter } from "../../utils/emitter.js";

export default createModel({
	name: "gpt",

	parameters: {
		messages: {
			type: [] as OpenAIMessage[],
			required: true
		},

		model: {
			type: "string",
			default: "gpt-3.5-turbo",

			choices: [
				"gpt-3.5-turbo",
				"gpt-3.5-turbo-16k",
				"gpt-4",
				"gpt-4-vision-preview"
			]
		},

		maxTokens: {
			type: "number",
			default: 512
		},

		temperature: {
			type: "number",
			default: 0.9
		},
		
		plugins: {
			type: [] as string[],
			default: []
		}
	},

	execute: async ({ messages, maxTokens, model, temperature, plugins }, emitter, api) => {
		if (model == "gpt-4-vision-preview") {
			const last = messages[messages.length - 1];

			if (Array.isArray(last.content)) plugins = [];
			else model = "gpt-4-1106-preview";
			
		} else if (model.includes("gpt-3.5-turbo")) {
			model = "gpt-3.5-turbo-1106";
		}

		if (plugins.length > 0) {
			const tools = plugins.map(id => pluginToOpenAITool((CHAT_PLUGINS as any)[id]));

			const response = await executeOpenAIRequest({
				body: { messages, tools, max_tokens: maxTokens, model, temperature },
				cost: OPENAI_PRICES[model as keyof typeof OPENAI_PRICES],
				emitter: new Emitter()
			});

			/* If the plugin result got cut off, we can't continue. */
			if (response.finishReason === "length") throw new Error("Plugin result got cut off");

			/* If the AI didn't call any functions, simply return the response. */
			if (response.tools.length === 0) return emitter.emit(response);

			/* Add the original assistant response with all tool calls. */
			messages.push({
				role: "assistant",
				content: "",
				tool_calls: response.tools.map((tool, index) => ({
					type: "function", index, id: tool.id, function: {
						name: tool.plugin.id,
						arguments: tool.data						
					}
				}))
			});

			const outputs: Record<string, PluginResult> = {};

			for (const call of response.tools) {
				let result: PluginResult = {};

				try {
					result = await call.plugin.handler({
						messages, params: JSON.parse(call.data)
					}) ?? { data: "OK" };
 
				} catch (error) {
					const message = (error as Error).toString();

					api.logger.warn("Tool call failed for", bold(call.plugin.id), "->", message);
					result.error = message;
				}

				messages.push({
					role: "tool",
					tool_call_id: call.id,
					content: JSON.stringify(result.data ?? result.error ?? "OK"),
					name: call.plugin.id
				});

				if (result.instructions) messages.push({
					role: "system", content: result.instructions
				});

				outputs[call.plugin.id] = result;
			}

			const res = new Emitter<ModelData>();
			
			res.on(data => emitter.emit({ ...data, tools: response.tools!.map(t => ({
				id: t.plugin.id,
				input: JSON.parse(t.data),
				output: outputs[t.plugin.id].data,
				images: outputs[t.plugin.id].images,
				failed: !!outputs[t.plugin.id].error
			})) }));

			await executeOpenAIRequest({
				body: { messages, max_tokens: maxTokens, model, temperature },
				cost: OPENAI_PRICES[model as keyof typeof OPENAI_PRICES],
				emitter: res
			});

		} else {
			await executeOpenAIRequest({
				body: { messages, max_tokens: maxTokens, model, temperature },				
				cost: OPENAI_PRICES[model as keyof typeof OPENAI_PRICES],
				emitter
			});
		}
	}
});
import type { OpenAIChatTool, OpenAIChatFunctionParameter, OpenAIMessage } from "../types/chat.js";
import type { ModelParameterType } from "../models/mod.js";

import { OPENWEATHER_API_KEY, TENOR_API_KEY } from "../config.js";
import { renderGraphvizCode } from "./graphviz.js";

type PluginParameter = Omit<OpenAIChatFunctionParameter, "required"> & {
    required?: boolean;
}

type PluginParametersToOptions<T extends Record<string, PluginParameter>>
	= { [K in keyof T]: ModelParameterType<T[K]["type"]> };

interface PluginOptions<Params extends Record<string, PluginParameter>> {
	messages: OpenAIMessage[];
	params: PluginParametersToOptions<Params>;
}

export interface PluginResult {
	/** Raw data to pass to the model */
	data?: object;

	/** Any error that occured */
	error?: string;

	/** Image data to display in the generated message, on the bot side */
	images?: string[];

	/** Additional instructions to add to the chat history */
	instructions?: string;
}

export interface Plugin<Params extends Record<string, PluginParameter> = Record<string, PluginParameter>> {
	/** Identifier of the plugin */
	id: string;
	
	/** Type of this plugin */
	type?: "function";

	/* Fitting emoji for this plugin */
	emoji: string;

	/** Description of the plugin to pass to the model */
	description: string;

	/** Parameters this plugin takes as input */
	parameters: Params;

	/** Function to execute this plugin */
	handler: (options: PluginOptions<Params>) => Promise<PluginResult>;
}

export function pluginToOpenAITool(p: Plugin): OpenAIChatTool {
	const empty = p.parameters === null || Object.keys(p.parameters).length === 0;
	const parameters: Record<string, OpenAIChatFunctionParameter> = {};

	/* Required parameters */
	const required: string[] = [];

	if (!empty) for (const [ key, param ] of Object.entries(p.parameters!)) {
		if (param.required) required.push(key);
		delete param.required;

		parameters[key] = param as OpenAIChatFunctionParameter;
	}

	return {
		type: p.type ?? "function",
		function: {
			name: p.id, description: p.description,
			parameters: {
				type: "object", properties: parameters, required
			}
		}
	};
}

function createPlugin<Params extends Record<string, PluginParameter>>(plugin: Plugin<Params>) {
	return plugin;
}

export const CHAT_PLUGINS = {
	weather: createPlugin({
		id: "weather",
		description: "Figure out the weather for any location.",
		emoji: "🌤️",
		parameters: {
			location: {
				type: "string",
				description: "The city and state, e.g. San Francisco, CA",
				required: true
			},
			unit: {
				type: "string",
				description: "Which temperature unit to use",
				enum: [ "metric", "imperial" ]
			}
		},
		handler: async ({ params }) => {
			const data = await (await fetch(
				`https://api.openweathermap.org/data/2.5/weather?q=${params.location}&units=${params.unit ?? "metric"}&appid=${OPENWEATHER_API_KEY}`
			)).json();

			return {
				data: {
					desc: data.weather[0].description,
					temp: {
						actual: data.main.temp,
						feels_like: data.main.feels_like
					},
					humidity: data.main.humidity,
					wind: data.wind 
				}
			};
		}
	}),

	tenor: createPlugin({
		id: "tenor",
		description: "Search for GIFs on Tenor.",
		emoji: "📷",
		parameters: {
			query: {
				type: "string",
				required: true
			}
		},
		handler: async ({ params }) => {
			const data = await (await fetch(
				`https://tenor.googleapis.com/v2/search?q=${params.query}&limit=3&key=${TENOR_API_KEY}`
			)).json();

			return {
				data: data.results.map((gif: { url: string; title: string; }) => ({
					url: gif.url, title: gif.title
				}))
			};
		}
	}),

	diagrams: createPlugin({
		id: "diagrams",
		description: "Generate diagrams using Graphviz dot code. Once finished, you CANNOT repeat the dot code, as it's already rendered externally.",
		emoji: "📊",
		parameters: {
			input: {
				type: "string",
				description: "Graphviz dot code to render using an external program. Keep it minimal & don't use too much formatting. Single line if possible.",
				required: true
			}
		},
		handler: async ({ params }) => {
			const data = await renderGraphvizCode(params.input);

			return {
				instructions: "The Graphviz result has been rendered, you displayed the image in chat. Do not repeat the dot code in your response at all. Do not describe the Graphviz diagram, as you rendered it. Do not hallucinate file paths.",
				images: [ data ]
			};
		}
	})
};
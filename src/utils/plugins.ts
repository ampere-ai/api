import type { OpenAIChatTool, OpenAIChatFunctionParameter, OpenAIMessage } from "../types/chat.js";
import type { ModelParameterType } from "../models/mod.js";
import { OPENWEATHER_API_KEY, TENOR_API_KEY } from "../config.js";

type PluginParameter = Omit<OpenAIChatFunctionParameter, "required"> & {
    required?: boolean;
}

type PluginParametersToOptions<T extends Record<string, PluginParameter>>
	= { [K in keyof T]: ModelParameterType<T[K]["type"]> };

interface PluginOptions<Params extends Record<string, PluginParameter>> {
	messages: OpenAIMessage[];
	params: PluginParametersToOptions<Params>;
}

export interface Plugin<Params extends Record<string, PluginParameter> = Record<string, PluginParameter>> {
	/** Identifier of the plugin */
	id: string;

	/** Name of the plugin to pass to the model */
	name: string;

	/** Description of the plugin to pass to the model */
	description: string;

	/** Parameters this plugin takes as input */
	parameters: Params;

	/** Function to execute this plugin */
	handler: (options: PluginOptions<Params>) => Promise<object | void>;
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
		type: "function",
		function: {
			name: p.name, description: p.description,
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
	"weather": createPlugin({
		id: "weather",
		name: "Weather",
		description: "Figure out the weather for any location.",
		parameters: {
			location: {
				type: "string",
				description: "The city and state, e.g. San Francisco, CA",
				required: true
			}
		},
		handler: async ({ params }) => {
			const data = await (await fetch(
				`https://api.openweathermap.org/data/2.5/weather?q=${params.location}&units=metric&appid=${OPENWEATHER_API_KEY}`
			)).json();

			return {
				desc: data.weather[0].description,
				temp: {
					actual: data.main.temp,
					feels_like: data.main.feels_like
				},
				humidity: data.main.humidity,
				wind: data.wind 
			};
		}
	}),

	"tenor": createPlugin({
		id: "tenor",
		name: "Tenor",
		description: "Search for GIFs on Tenor.",
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

			return data.results.map((gif: { url: string; title: string; }) => ({
				url: gif.url, title: gif.title
			}));
		}
	})
};
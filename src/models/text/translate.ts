import { type OpenAIMessage, type OpenAIResponseBody, type OpenAIModel, OPENAI_PRICES } from "../../types/chat.js";

import { getChatMessageLength } from "../../utils/tokens.js";
import { openAIHeaders } from "../../utils/openai.js";
import { APIError } from "../../types/error.js";
import { createModel } from "../mod.js";

interface RawTranslationData {
	/** The translated content */
	content: string;

	/** The input language */
	input: string;

	/** An error that occurred, if applicable */
	error?: string;
}

export default createModel({
	name: "translate",

	parameters: {
		content: {
			type: "string",
			required: true
		},

		language: {
			type: "string",
			required: true
		},

		model: {
			type: "string",
			choices: [ "gpt-3.5-turbo", "gpt-4" ],
			default: "gpt-3.5-turbo"
		},

		maxTokens: {
			type: "number",
			default: 200
		}
	},

	execute: async ({ content, language, maxTokens, model }, emitter) => {
		const prompt = translationPrompt(content, language);

		const tokens = {
			prompt: getChatMessageLength(...prompt),
			completion: 0
		};

		if (tokens.prompt + maxTokens > 1000) throw new APIError({
			message: "Resulting prompt is too long", code: 400
		});

		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: openAIHeaders(),

			body: JSON.stringify({
				messages: prompt, max_tokens: maxTokens, model, stream: false
			})
		});

		const body: OpenAIResponseBody = await response.json();
		const choice = body.choices[0];

		if (choice.finish_reason === "length") throw new APIError({
			message: "Response was cut off", code: 500
		});

		tokens.completion = body.usage.completion_tokens;

		const data: RawTranslationData | null = (content => {
			try {
				return JSON.parse(content);
			} catch {
				return null;
			}
		})(choice.message.content as string);

		if (data && data.error) throw new APIError({
			message: "Something went wrong while translating the text", code: 500
		});

		if (!data || !data.content || !data.input || data.content === "null") throw new APIError({
			message: "Something went wrong while translating the text", code: 500
		});

		if (data.content === content) throw new APIError({
			message: "The resulting translation has the same content", code: 400
		});

		emitter.emit({
			cost:
				(tokens.completion / 1000) * OPENAI_PRICES[model as OpenAIModel].input
				+ (tokens.prompt / 1000) * OPENAI_PRICES[model as OpenAIModel].output,
			
			done: true,

			content: data.content,
			error: data.error,
			language: data.input
		});
	}
});

function translationPrompt(content: string, language: string): OpenAIMessage[] {
	return [
		{
			role: "system",
			content: `
Your task is to translate the given input text by the user and guess the input language too. Follow all instructions closely.

You *must* structure the JSON object with these keys:
"content": Translation of the input message into the language. Make sure to translate it correctly & well, keep the meaning, slang, slurs & typos all the same, just translate it all into ${language}. Keep the same writing style consistently.
"input": Display name of the detected input language (guess it from the input, e.g. "English", "German", "Russian", "Base64", "Hex", etc.)

Errors that may occur:
"Couldn't detect message language": input is invalid, not known language
"Does not need to be translated": the message is already the target language (${language})

Otherwise, if you think any of the above errors apply to the message, add ONLY this property to the minified JSON object and ignore above properties:
"error": The error that occurred, one of the above

You must translate the given text by the user to the language "${language}". You can translate various arbitrary languages too, e.g. Pig Latin, Base64, Hex, Leetspeak, Reversed, and even more.
The user will now give you a message to translate, your goal is to apply the above rules and output a minified JSON object on a single line, without additional explanations or text.
			`.trim()
		},

		{
			content: content,
			role: "assistant"
		}
	];
}
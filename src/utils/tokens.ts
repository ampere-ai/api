import { get_encoding } from "@dqbd/tiktoken";
const encoder = get_encoding("cl100k_base");

import type { OpenAIMessage } from "../types/chat.js";

/** Count together all tokens contained in a list of conversation messages. */
export function getChatMessageLength(...messages: OpenAIMessage[]) {
	/* Total tokens used for the messages */
	let total: number = 0;

	for (const message of messages) {
		/* Map each property of the message to the number of tokens it contains. */
		const propertyTokenCounts = Object.values(message).map(value => {
			/* Count the number of tokens in the property value. */
			return getMessageTokens(value);
		});

		/* Sum the number of tokens in all properties and add 4 for metadata. */
		total += propertyTokenCounts.reduce((a, b) => a + b, 4);
	}

	return total + 2;
}

/** Count together all the tokens in a string. */
export function getMessageTokens(content: string) {
	return encoder.encode(content).length;
}
import { OpenAIMessage } from "../../types/message.js";
import { createModel } from "../mod.js";

export default createModel({
	name: "gpt",

	parameters: {
		messages: {
			type: [] as OpenAIMessage[],
			required: true
		}
	},

	execute: (options, emitter) => {
		emitter.emit({
			done: true, cost: 0
		});
	}
});
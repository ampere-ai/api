export interface OpenAIMessage {
	role: "system" | "assistant" | "user";
	content: string;
}
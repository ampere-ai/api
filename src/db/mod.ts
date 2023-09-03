import RabbitMQ from "rabbitmq-client";

import type {
	CollectionName, DBRequestData, DBRequestFetch,
	DBRequestGet, DBRequestType, DBRequestUpdate,
	DBResponse, DBType, DBObject
} from "./types/mod.js";

import { RABBITMQ_URI } from "../config.js";

const connection = new RabbitMQ.Connection(RABBITMQ_URI);

const rpc = connection.createRPCClient({
	confirm: true
});

await new Promise<void>(resolve =>
	connection.on("connection", () => resolve())
);

async function execute<T>(type: DBRequestType, body: Omit<DBRequestData, "type">): Promise<T> {
	const data = await rpc.send("db", {
		type, ...body
	});

	const response: DBResponse = data.body;

	if (!response.success && response.error) throw new Error(`DB error: ${response.error}`);
	return response.data;
}

export async function get<T = DBType>(collection: CollectionName, id: string | bigint): Promise<T | null> {
	return await execute("get", {
		collection, id: id.toString()
	} as DBRequestGet);
}

export async function fetch<T = DBType>(collection: CollectionName, id: string | bigint): Promise<T> {
	return await execute("fetch", {
		collection, id: id.toString()
	} as DBRequestFetch);
}

export async function update<T = DBType>(
	collection: CollectionName, id: string | bigint | DBObject, updates: Partial<Omit<T, "id">>
): Promise<T> {
	return await execute("update", {
		collection, id: typeof id === "bigint" ? id.toString() : id, updates
	} as DBRequestUpdate);
}
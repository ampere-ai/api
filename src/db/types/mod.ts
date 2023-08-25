import type { DBGuild } from "./guild.js";
import type { DBUser } from "./user.js";

export type CollectionName = "users" | "guilds";
export const CollectionNames: CollectionName[] = [ "users", "guilds" ];

export type DBType = DBUser | DBGuild;

export type DBObject = {
	id: string;
} & Record<string, any>;

export interface DBEnvironment {
	user: DBUser;
	guild: DBGuild | null;
}

export type DBRequestType = "get" | "fetch" | "update" | "delete" | "all";

export type DBRequestData = DBRequestGet | DBRequestFetch | DBRequestUpdate | DBRequestDelete | DBRequestAll;

export interface DBRequestGet {
	type: "get";

	collection: CollectionName;
	id: string;
}

export interface DBRequestFetch {
	type: "fetch";

	collection: CollectionName;
	id: string;
}

export interface DBRequestUpdate {
	type: "update";

	collection: CollectionName;
	id: string;
	updates: Record<string, any>;
}

export interface DBRequestDelete {
	type: "delete";

	collection: CollectionName;
	id: string;
}

export interface DBRequestAll {
	type: "all";
	collection: CollectionName;
}

export type DBResponse = {
	success: boolean;
	error?: string;
	data: any;
}
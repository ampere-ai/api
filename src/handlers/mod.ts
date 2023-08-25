import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { bold } from "colorette";

import type { Model } from "../models/mod.js";
import type { API } from "../mod.js";

export type HandlerType = "text";
export const HandlerTypes: HandlerType[] = [ "text" ];

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadModels(type: HandlerType, client: API) {
	if (client.handlers[type].length > 0) return;

	const path = join(__dirname, `../models/${type}`);
	const models: Model[] = [];

	const files = (await readdir(path))
		.filter(path => path.endsWith(".js"));

	for (const file of files) {
		const { default: model } = await import(`../models/${type}/${file}`);
		models.push(model);
	}

	client.handlers[type] = models;
	client.logger.info(`Loaded ${bold(models.length.toString())} ${type} models.`);
}
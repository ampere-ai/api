import { readdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { bold } from "colorette";
export const HandlerTypes = [
    "text"
];
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function loadModels(type, client) {
    if (client.handlers[type].length > 0) return;
    const path = join(__dirname, `../models/${type}`);
    const models = [];
    const files = (await readdir(path)).filter((path)=>path.endsWith(".js"));
    for (const file of files){
        const { default: model } = await import(`../models/${type}/${file}`);
        models.push(model);
    }
    client.handlers[type] = models;
    client.logger.info(`Loaded ${bold(models.length.toString())} ${type} models.`);
}

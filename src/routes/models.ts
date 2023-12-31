import express, { type NextFunction, type Request, type Response } from "express";


import { HandlerTypes, type HandlerType } from "../handlers/mod.js";
import { ModelData, type Model } from "../models/mod.js";
import { Emitter } from "../utils/emitter.js";
import { auth } from "../middlewares/auth.js";
import { APIError } from "../types/error.js";
import api from "../mod.js";

const router = express.Router();

async function request(req: Request, res: Response, next: NextFunction) {
	const { type, model: modelName } = req.params;
	const body = req.body;

	if (!HandlerTypes.includes(type as HandlerType)) return next(
		new APIError({ message: "Invalid type", code: 404 })
	);

	/* Models of this type */
	const models = api.handlers[type as HandlerType];

	/* Find the corresponding model. */
	const model = models.find(m => m.name === modelName);

	if (!model) return next(
		new APIError({ message: "Invalid model", code: 404 })
	);

	/* Whether the request should be streaming */
	const stream = Boolean(body.stream);
	delete body.stream;

	if (stream) {
		res.set("Content-Type", "text/event-stream");
	}

	try {
		/* Event emitter for partial results */
		const emitter = new Emitter<ModelData>();

		if (stream) {
			emitter.on(data => {
				res.write(`data: ${JSON.stringify(data)}\n\n`);
				if (data.done) res.end();
			});
		} else {
			emitter.wait().then(result => res.json(result));
		}

		/* Parse the specified options. */
		const parameters = parseParameters(model, body);

		/* Execute the model. */
		await model.execute(parameters, emitter, api);

	} catch (error) {
		next(error);
	}
}

function parseParameters(model: Model, body: Record<string, any>) {
	const options: Record<string, any> = {};

	for (const [ key, settings ] of Object.entries(model.parameters)) {
		if (settings.required && !body[key]) throw new APIError({
			message: `Missing parameter: ${key}`
		});

		if (!settings.required && !body[key]) {
			options[key] = settings.default ?? undefined;
			continue;
		}

		if (settings.choices && !settings.choices.includes(body[key])) throw new APIError({
			message: `Invalid parameter: ${key}`
		});

		if (settings.type === "string") {
			options[key] = body[key].toString();
		} else if (settings.type === "number") {
			if (isNaN(parseFloat(body[key]))) throw new APIError({
				message: `Invalid parameter: ${key}`
			});

			options[key] = parseFloat(body[key]);

		} else if (settings.type === "boolean") {
			options[key] = Boolean(body[key]);
			
		} else {
			options[key] = body[key];
		}
	}

	return options;
}

router.post(
	"/:type/:model", auth, request
);

export default router;
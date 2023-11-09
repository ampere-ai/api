import RabbitMQ, { type Publisher } from "rabbitmq-client";
import { createLogger } from "@discordeno/utils";
import express, { Application } from "express";
import { bold } from "colorette";
import cors from "cors";

import dotenv from "dotenv";
dotenv.config();

import type { Model } from "./models/mod.js";

import { loadModels, type HandlerType, HandlerTypes } from "./handlers/mod.js";
import { handleError } from "./middlewares/error.js";
import { invalidPath } from "./middlewares/404.js";
import { API_PORT, RABBITMQ_URI } from "./config.js";

/* Routes */
import StorageRoute from "./routes/storage.js";
import DatasetRoute from "./routes/dataset.js";
import ModelsRoute from "./routes/models.js";
import OtherRoute from "./routes/other.js";
import BaseRoute from "./routes/base.js";

export interface API {
	/** The HTTP server */
	express: Application;

	/** All loaded model handlers */
	handlers: Record<HandlerType, Model[]>;

	/** RabbitMQ publisher */
	rabbitmq: {
		publisher: Publisher;
	}

	/** The logger */
	logger: ReturnType<typeof createLogger>;
}

const rabbitmq = new RabbitMQ.Connection(RABBITMQ_URI);

const api: API = {
	express: express(),
	logger: createLogger({ name: "API" }),
	handlers: { text: [], image: [] },

	rabbitmq: {
		publisher: rabbitmq.createPublisher()
	}
};

api.express.use(express.json({
	limit: "50mb"
}));

api.express.use(express.urlencoded({
	limit: "50mb", extended: true
}));

api.express.use(express.raw({
	limit: "50mb", type: [ "image/*" ]
}));

api.express.use(
	cors({
		methods: [ "GET", "POST", "PUT", "DELETE" ],
		allowedHeaders: [ "Content-Type", "Authorization" ]
	})
);

api.express.disable("x-powered-by");

/* Routes */
api.express.use("/storage", StorageRoute);
api.express.use("/dataset", DatasetRoute);
api.express.use("/other", OtherRoute);
api.express.use("/", ModelsRoute);
api.express.use("/", BaseRoute);

/* Error handlers */
api.express.use(invalidPath);
api.express.use(handleError);

api.express.listen(API_PORT, async () => {
	api.logger.info(`Started API on port ${bold(API_PORT.toString())}.`);
});

/* Load all of the models. */
for (const type of HandlerTypes) {
	await loadModels(type, api);
}

export default api;
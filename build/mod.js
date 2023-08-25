import { createLogger } from "@discordeno/utils";
import express from "express";
import { bold } from "colorette";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import { loadModels, HandlerTypes } from "./handlers/mod.js";
import { handleError } from "./middlewares/error.js";
import { invalidPath } from "./middlewares/404.js";
import { API_PORT } from "./config.js";
/* Routes */ import ModelsRoute from "./routes/models.js";
import BaseRoute from "./routes/base.js";
const api = {
    express: express(),
    logger: createLogger({
        name: "API"
    }),
    handlers: {
        text: []
    }
};
api.express.use(express.json({
    limit: "50mb"
}));
api.express.use(express.urlencoded({
    limit: "50mb",
    extended: true
}));
api.express.use(cors({
    methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE"
    ],
    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ]
}));
/* Routes */ api.express.use("/", ModelsRoute);
api.express.use("/", BaseRoute);
/* Error handlers */ api.express.use(invalidPath);
api.express.use(handleError);
api.express.listen(API_PORT, async ()=>{
    api.logger.info(`Started API on port ${bold(API_PORT.toString())}.`);
});
/* Load all of the models. */ for (const type of HandlerTypes){
    await loadModels(type, api);
}
export default api;

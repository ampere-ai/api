import type { NextFunction, Request, Response } from "express";
import express from "express";

import { CHAT_PLUGINS } from "../utils/plugins.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.get("/plugins", auth, (_, res) => {
	res.send(Object.values(CHAT_PLUGINS));
});

export default router;
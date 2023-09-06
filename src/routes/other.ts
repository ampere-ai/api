import type { NextFunction, Request, Response } from "express";
import express from "express";

import type { DBUser } from "../db/types/user.js";

import { APIError } from "../types/error.js";
import { TOPGG_AUTH } from "../config.js";
import { update } from "../db/mod.js";
import api from "../mod.js";

const router = express.Router();

interface TopGGVote {
	type: "upvote" | "test";
	user: string;
}

function verifyVote(request: Request, _: Response, next: NextFunction) {
	if (request.headers.authorization === TOPGG_AUTH) {
		next();
	} else {
		throw new APIError({
			message: "Invalid authorization", code: 400
		});
	}
}

router.post("/vote", verifyVote, async (req, res) => {
	const body: TopGGVote = req.body;

	if (body.type === "test") {
		api.logger.info("Test vote triggered");
		return res.json({ success: true });
	}

	await update<DBUser>("users", body.user, {
		voted: new Date().toISOString()
	});

	res.json({ success: true });
});

export default router;
import express from "express";

import { auth } from "../middlewares/auth.js";
import { APIError } from "../types/error.js";
import { getStorageURL, uploadToStorage } from "../utils/storage.js";

const router = express.Router();

router.get("/:bucket/:path", auth, async (req, res, next) => {
	try {
		const url = getStorageURL(req.params.bucket, req.params.path);
		const response = await fetch(url);

		if (!response.ok) return next(new APIError({
			message: "Failed to fetch storage file", code: 500
		}));

		const buffer = Buffer.from(await response.arrayBuffer());

		res.setHeader("Content-Type", response.headers.get("content-type")!);
		res.send(buffer);
		
	} catch {
		return next(new APIError({
			message: "Storage file doesn't exist", code: 404
		}));
	}
});

router.post("/:bucket/:path", auth, async (req, res, next) => {
	try {
		const data = await uploadToStorage(
			req.params.bucket, req.params.path, req.params.body, req.headers["content-type"]!
		);

		if (data.error) return next(new APIError({
			message: data.error.message, code: 500
		}));
		
		res.send({
			success: true
		});

	} catch (error) {
		return next(new APIError({
			message: (error as Error).toString()
		}));
	}
});

export default router;
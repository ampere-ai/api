import { StorageClient } from "@supabase/storage-js";
import express from "express";

import { auth } from "../middlewares/auth.js";

import { DB_KEY, DB_URL } from "../config.js";
import { APIError } from "../types/error.js";

const client = new StorageClient(`${DB_URL}/storage/v1`, {
	apikey: DB_KEY, Authorization: `Bearer ${DB_KEY}`
});

const router = express.Router();

router.get("/:bucket/:path", auth, async (req, res, next) => {
	try {
		const { data: { publicUrl } } = client.from(req.params.bucket).getPublicUrl(
			req.params.path
		);

		const response = await fetch(publicUrl);

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
		const data = await client.from(req.params.bucket).upload(
			req.params.path, req.body, {
				contentType: req.headers["content-type"]
			}
		);

		if (data.error) return next(new APIError({
			message: data.error.message,
			code: (data.error as any).statusCode
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
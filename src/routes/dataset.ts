import express from "express";

import { auth } from "../middlewares/auth.js";

import { DBDatasetEntry } from "../db/types/dataset.js";
import { APIError } from "../types/error.js";
import { get, update } from "../db/mod.js";

const router = express.Router();

function setEntry(type: string, id: string, data: any) {
	return update<DBDatasetEntry>("datasets", id, {
		type, data
	});
}

function getEntry(type: string, id: string) {
	return get("datasets", id);
}

router.get("/:type/:id", auth, async (req, res, next) => {
	try {
		const entry = await getEntry(
			req.params.type, req.params.id
		);

		if (!entry) return next(new APIError({
			message: "Dataset entry doesn't exist", code: 404
		}));

		res.json({
			type: req.params.type, ...entry
		});
		
	} catch (error) {
		return next(new APIError({
			message: (error as Error).toString()
		}));
	}
});

router.post("/:type/:id", auth, async (req, res, next) => {
	try {
		const entry = await getEntry(
			req.params.type, req.params.id
		);

		if (entry) return next(new APIError({
			message: "Dataset entry already exists", code: 409
		}));

		const updated = await setEntry(
			req.params.type, req.params.id, req.body
		);

		res.json(updated);
		
	} catch (error) {
		return next(new APIError({
			message: (error as Error).toString()
		}));
	}
});

export default router;
import sellix, { CreatePaymentData, CurrencyName, GatewayName } from "@sellix/node-sdk";
import RabbitMQ from "rabbitmq-client";
import express from "express";
import crypto from "crypto";

import { RABBITMQ_URI, SELLIX_API_KEY, SELLIX_EMAIL, SELLIX_WEBHOOK_SECRET } from "../config.js";
import { PlanCredit } from "../db/types/premium.js";
import { auth } from "../middlewares/auth.js";
import { APIError } from "../types/error.js";
import { fetch, update } from "../db/mod.js";

const router = express.Router();

/* Sellix API manager */
const api = sellix(SELLIX_API_KEY);

const connection = new RabbitMQ.Connection(RABBITMQ_URI);
const publisher = connection.createPublisher();

interface Product {
	title: string;
	price?: number;
	currency: CurrencyName;
}

const PRODUCTS: Record<string, Product> = {
	GUILD_SUBSCRIPTION: {
		title: "Server Subscription",
		price: 19.99, currency: "EUR"
	},

	USER_SUBSCRIPTION: {
		title: "User Subscription",
		price: 5.99, currency: "EUR"
	},
	
	PLAN_CREDITS: {
		title: "Plan Credits", currency: "USD"
	}
};

/** Duration of a Premium subscription, in milliseconds */
const PREMIUM_SUB_DURATION = 30 * 24 * 60 * 60 * 1000;

router.post("/", auth, async (req, res, next) => {
	/* User data */
	const user: {
		name: string, id: string
	} = req.body.user;

	/** Which gateway they want to use */
	const gateway: GatewayName | undefined = req.body.gateway;

	/** Which type of subscription they want to buy */
	const type: "plan" | "subscription" = req.body.type;

	/* How many credits to buy, if type is plan */
	const credits: number = req.body.credits;

	if (!credits && type === "plan") return next(new APIError({
		message: "Credit amount must be specified if type is plan", code: 403
	}));

	/* Guild ID, if they want to purchase a Premium server subscription or plan */
	const guild: string = req.body.guild;

	/* Try to find the corresponding Sellix customer. */
	const customers = await api.customers.list();
	let customer = customers.find(c => c.email === user.id);

	if (!customer) {
		try {
			await api.customers.create({
				name: user.name, surname: "Unknown", email: user.id
			});

			const customers = await api.customers.list();
			customer = customers.find(c => c.email === user.id)!;

		} catch (error) {
			return next(new APIError({
				message: "Failed to create customer", code: 500
			}));
		}
	}

	try {
		/* Which product to use */
		const product: Product =
			type === "subscription"
				? guild
					? PRODUCTS.GUILD_SUBSCRIPTION
					: PRODUCTS.USER_SUBSCRIPTION
				: PRODUCTS.PLAN_CREDITS;

		const data: CreatePaymentData = {
			return_url: "https://discord.gg/ampere-chatgpt-1063957096225321075",
			email: SELLIX_EMAIL,
			white_label: false,
			gateway,
			customer_id: customer.id,
			custom_fields: {
				userId: user.id,
				guildId: guild,
				type
			},
			title: product.title,
			value: type === "plan" && credits ? credits : product.price,
			currency: product.currency
		};

		if (type === "plan" && credits) data.custom_fields.credits = credits;

		const payment = await api.payments.create(data);
		res.json({ url: payment.url });

	} catch (error) {
		console.log(error);

		return next(new APIError({
			message: "Failed to create payment", code: 500
		}));
	}
});

router.post("/webhook", async (req, res, next) => {
	const headerSignature = req.headers["x-sellix-unescaped-signature"];
	const body = req.body;

	if (!headerSignature) return next(new APIError({
		message: "No signature", code: 400
	}));
  
	const signature = crypto
		.createHmac("sha512", SELLIX_WEBHOOK_SECRET)
		.update(JSON.stringify(body))
		.digest("hex");
  
	if (
		!crypto.timingSafeEqual(
			Buffer.from(signature),
			Buffer.from(headerSignature as any, "utf-8")
		)
	) return next(new APIError({
		message: "Invalid signature", code: 400
	}));	

	if (body.event !== "order:paid") return next(new APIError({
		message: "Invalid event", code: 400
	}));

	const type: "subscription" | "plan" = body.data.custom_fields.credits ? "plan" : "subscription";
	const location: "user" | "guild" = body.data.custom_fields.guildId ? "guild" : "user";

	/* Existing database entry */
	const db = await fetch(
		`${location}s`, location === "guild" ? body.data.custom_fields.guildId : body.data.custom_fields.userId
	);

	const data = {
		userId: body.data.custom_fields.userId,
		guildId: body.data.custom_fields.guildId ?? null,
		credits: body.data.custom_fields.credits ?? null,
		type, location,
		extended: type === "subscription" && db.subscription !== null,
		gateway: body.data.gateway
	};

	/* Subscription */
	if (type === "subscription") {
		await update(
			`${location}s`, db, {
				subscription: db.subscription !== null
					/* Existing */
					? {
						since: db.subscription.since,
						expires: db.subscription.expires + PREMIUM_SUB_DURATION
	
					/* New */
					} : {
						since: Date.now(),
						expires: Date.now() + PREMIUM_SUB_DURATION
					}
			}
		);

	/* Plan */
	} else if (type === "plan") {
		const credit: PlanCredit = {
			amount: data.credits,
			gateway: data.gateway,
			time: Date.now(),
			type: "purchase"
		};

		await update(
			`${location}s`, db, {
				plan: db.plan !== null
					/* Existing */
					? {
						total: db.plan.total + data.credits,
						history: [ ...db.plan.history, credit ],
						expenses: db.plan.expenses,
						used: db.plan.used
	
					/* New */
					} : {
						total: data.credits, used: 0,
						expenses: [], history: []
					}
			}
		);
	}

	await publisher.send("payment", data);
	res.json({ success: true });
});

export default router;
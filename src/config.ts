import dotenv from "dotenv";
dotenv.config();

/** API authentication key */
export const API_KEY = process.env.API_KEY!;

/** Port to host the API on */
export const API_PORT = Number(process.env.API_PORT!);

/** RabbitMQ connection URI*/
export const RABBITMQ_URI = process.env.RABBITMQ_URI!;

/** Sellix payment processing */
export const SELLIX_API_KEY = process.env.SELLIX_API_KEY!;
export const SELLIX_WEBHOOK_SECRET = process.env.SELLIX_WEBHOOK_SECRET!;
export const SELLIX_EMAIL = process.env.SELLIX_EMAIL!;

/** Various third-party API keys */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
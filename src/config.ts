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

/** Supabase authentication */
export const DB_URL = process.env.DB_URL!;
export const DB_KEY = process.env.DB_KEY!;

/** Various third-party API keys */
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
export const STABILITY_API_KEY = process.env.STABILITY_API_KEY!;
export const SH_API_KEY = process.env.SH_API_KEY!;
export const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY!;
export const MAKERSUITE_API_KEY = process.env.MAKERSUITE_API_KEY!;
export const DEEPINFRA_API_KEY = process.env.DEEPINFRA_API_KEY!;
export const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
export const TENOR_API_KEY = process.env.TENOR_API_KEY!;
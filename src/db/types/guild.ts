import type { DBPlan, DBSubscription } from "./premium.js";

export interface DBGuild {
	/** ID of the guild */
	id: string;

	/** When the guild first interacted with the bot */
	created: string;

	/** Data about the guild's subscription */
	subscription: DBSubscription | null;

	/** Data about the guild's pay-as-you-go plan */
	plan: DBPlan | null;

    /** The guild's metadata */
    metadata: Record<string, any>;
}
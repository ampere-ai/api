import type { DBPlan, DBSubscription } from "./premium.js";

export interface DBUser {
	/** ID of the user */
	id: string;

	/** When the user first interacted with the bot */
	created: string;

	/** Data about the user's subscription */
	subscription: DBSubscription | null;

	/** Data about the user's pay-as-you-go plan */
	plan: DBPlan | null;

	/** When the user last voted for the bot */
	voted: string | null;

    /** The user's metadata */
    metadata: Record<string, any>;

    /** The user's roles */
    roles: DBRole[];
}

export enum DBUserType {
	PremiumSubscription = "subscription",
	PremiumPlan = "plan",
	Voter = "voter",
	User = "user"
}

export enum DBRole {
	Owner = "owner",
	Moderator = "moderator",
	Investor = "investor",
	Advertiser = "advertiser",
	API = "api",
	Tester = "tester"
}
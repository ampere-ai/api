declare module "@sellix/node-sdk" {
	export interface Customer {
		id: string;
		email: string;
		name: string;
		surname: string;
	}

	export interface CreatePaymentData {
		return_url: string;
		email: string;
		white_label: boolean;
		gateway?: GatewayName;
		customer_id: string,
		custom_fields: Record<string, string | number>;
		value?: number;
		product_id?: string;
		title?: string;
		currency?: CurrencyName;
	}

	export interface Payment {
		url: string;
		uniqid: string;
	}

	export type GatewayName = "BITCOIN" | "ETHEREUM" | "BINANCE_COIN" | "MONERO" | "STRIPE" | "PAYPAL" | "BINANCE";
	export type CurrencyName = "EUR" | "USD";

	interface Sellix {
		customers: {
			list: () => Promise<Customer[]>;
			create: (data: Partial<Customer>) => Promise<Customer>;
		};

		payments: {
			create: (data: CreatePaymentData) => Promise<Payment>;
		};
	}

	export default function(key: string): Sellix;
}
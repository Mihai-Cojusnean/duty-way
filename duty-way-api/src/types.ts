export type Role = 'admin' | 'user';

export interface TelegramInitDataUser {
	readonly id: number;
	readonly username?: string;
	readonly language_code?: string;
}

export interface User {
	readonly telegram_id: string;
	readonly username: string;
	readonly language: string;
	readonly work_name: string;
	readonly is_admin: boolean;
	readonly shifts?: readonly unknown[];
}

export interface StoredShifts {
	readonly shifts?: readonly unknown[];
}

export interface UserUpdate {
	readonly shifts?: readonly unknown[];
}

export interface SaleRequest {
	readonly brand: string;
	readonly perfumeId: string;
	readonly perfumeName: string;
	readonly priceLabel: string;
	readonly amountCents: number;
	readonly currency: 'EUR';
}

export interface SalesSummary {
	readonly count: number;
	readonly totalCents: number;
	readonly currency: 'EUR';
}

export interface DailySalesSummary {
	readonly date: string;
	readonly count: number;
	readonly totalCents: number;
	readonly currency: 'EUR';
}

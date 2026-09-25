import type { SaleRequest, UserUpdate } from './types';

export function json(body: unknown, corsHeaders: Record<string, string>, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			...corsHeaders,
			'Content-Type': 'application/json; charset=UTF-8',
		},
	});
}

export function isUserUpdate(value: unknown): value is UserUpdate {
	return (
		typeof value === 'object' &&
		value !== null &&
		(!('shifts' in value) || Array.isArray(value.shifts))
	);
}

export function isSaleRequest(value: unknown): value is SaleRequest {
	return (
		typeof value === 'object' &&
		value !== null &&
		'brand' in value &&
		typeof value.brand === 'string' &&
		value.brand.trim().length > 0 &&
		'perfumeId' in value &&
		typeof value.perfumeId === 'string' &&
		value.perfumeId.trim().length > 0 &&
		'perfumeName' in value &&
		typeof value.perfumeName === 'string' &&
		value.perfumeName.trim().length > 0 &&
		'priceLabel' in value &&
		typeof value.priceLabel === 'string' &&
		value.priceLabel.trim().length > 0 &&
		'amountCents' in value &&
		typeof value.amountCents === 'number' &&
		Number.isSafeInteger(value.amountCents) &&
		value.amountCents >= 0 &&
		'currency' in value &&
		value.currency === 'EUR'
	);
}

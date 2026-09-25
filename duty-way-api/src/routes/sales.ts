import type { DailySalesSummary, SalesSummary, User } from '../types';
import {isSaleRequest, json} from "../utlis";

export async function getSalesSummary(
	currentUser: User,
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const brand = url.searchParams.get('brand')?.trim() || undefined;

	return json(await getTodaySalesSummary(env, currentUser.telegram_id, brand), corsHeaders);
}

export async function getSalesToday(
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const today = new Date().toISOString().slice(0, 10);

	const result = await env.DB.prepare(
		`SELECT id, brand, perfume_id, perfume_name, price_label, amount_cents, currency, sold_at
		 FROM sales
		 WHERE telegram_user_id = ?
		   AND date(sold_at) = ?
		 ORDER BY sold_at DESC`,
	)
		.bind(currentUser.telegram_id, today)
		.all<{
			id: string;
			brand: string;
			perfume_id: string;
			perfume_name: string;
			price_label: string;
			amount_cents: number;
			currency: 'EUR';
			sold_at: string;
		}>();

	const soldBy = currentUser.work_name || currentUser.username || 'Unknown';

	const sales = result.results.map((row) => ({
		id: row.id,
		brand: row.brand,
		perfume: { id: row.perfume_id, name: row.perfume_name },
		price: {
			label: row.price_label,
			amountCents: row.amount_cents,
			currency: row.currency,
		},
		soldAt: new Date(row.sold_at).toISOString(),
		soldBy,
	}));

	return json(sales, corsHeaders);
}

export async function getSalesHistoryRoute(
	currentUser: User,
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const requestedDays = Number(url.searchParams.get('days') ?? '7');
	const days =
		Number.isInteger(requestedDays) && requestedDays >= 1 && requestedDays <= 31 ? requestedDays : 7;

	return json({ days: await getSalesHistory(env, currentUser.telegram_id, days) }, corsHeaders);
}

export async function postSale(
	request: Request,
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const body = await request.json().catch(() => null);

	if (!isSaleRequest(body)) {
		return json({ error: 'Invalid sale data.' }, corsHeaders, 400);
	}

	const saleId = crypto.randomUUID();

	await env.DB.prepare(
		`INSERT INTO sales (id,
		                    telegram_user_id,
		                    brand,
		                    perfume_id,
		                    perfume_name,
		                    price_label,
		                    amount_cents,
		                    currency)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	)
		.bind(
			saleId,
			currentUser.telegram_id,
			body.brand.trim(),
			body.perfumeId.trim(),
			body.perfumeName.trim(),
			body.priceLabel.trim(),
			body.amountCents,
			body.currency,
		)
		.run();

	return json(
		{ id: saleId, summary: await getTodaySalesSummary(env, currentUser.telegram_id) },
		corsHeaders,
		201,
	);
}

export async function deleteSale(
	saleId: string,
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const result = await env.DB.prepare(`DELETE FROM sales WHERE id = ? AND telegram_user_id = ?`)
		.bind(saleId, currentUser.telegram_id)
		.run();

	if (result.meta.changes === 0) {
		return json({ error: 'Sale not found.' }, corsHeaders, 404);
	}

	return new Response(null, { status: 204, headers: corsHeaders });
}

async function getTodaySalesSummary(
	env: Env,
	telegramId: string,
	brand?: string,
): Promise<SalesSummary> {
	const today = new Date().toISOString().slice(0, 10);

	const statement = brand
		? env.DB.prepare(
			`SELECT
					COUNT(*) AS count,
					COALESCE(SUM(amount_cents), 0) AS total_cents
				 FROM sales
				 WHERE telegram_user_id = ?
				   AND brand = ?
				   AND date(sold_at) = ?`,
		).bind(telegramId, brand, today)
		: env.DB.prepare(
			`SELECT
					COUNT(*) AS count,
					COALESCE(SUM(amount_cents), 0) AS total_cents
				 FROM sales
				 WHERE telegram_user_id = ?
				   AND date(sold_at) = ?`,
		).bind(telegramId, today);

	const result = await statement.first<{ count: number; total_cents: number }>();

	return {
		count: result?.count ?? 0,
		totalCents: result?.total_cents ?? 0,
		currency: 'EUR',
	};
}

async function getSalesHistory(
	env: Env,
	telegramId: string,
	days: number,
): Promise<readonly DailySalesSummary[]> {
	const result = await env.DB.prepare(
		`SELECT
			date(sold_at) AS date,
			COUNT(*) AS count,
			COALESCE(SUM(amount_cents), 0) AS total_cents
		 FROM sales
		 WHERE telegram_user_id = ?
		   AND date(sold_at) >= date('now', ?)
		 GROUP BY date(sold_at)
		 ORDER BY date(sold_at) DESC`,
	)
		.bind(telegramId, `-${days - 1} days`)
		.all<{
			date: string;
			count: number;
			total_cents: number;
		}>();

	return result.results.map((row) => ({
		date: row.date,
		count: row.count,
		totalCents: row.total_cents,
		currency: 'EUR' as const,
	}));
}

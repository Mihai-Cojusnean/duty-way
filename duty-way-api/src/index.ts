import { authenticateTelegramUser } from './auth';
import { getMe } from './routes/me';
import { getUser, postUser } from './routes/user';
import { getSalesSummary, getSalesToday, getSalesHistoryRoute, postSale, deleteSale } from './routes/sales';
import { getAdminUsers, getAdminUserSchedule } from './routes/admin';
import {json} from "./utlis";


export default {
	async fetch(request, env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
		};

		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);

		if (request.method === 'GET' && url.pathname === '/api/health') {
			return json({ ok: true }, corsHeaders);
		}

		try {
			const currentUser = await authenticateTelegramUser(request, env);

			if (!currentUser) {
				return json(
					{ error: 'Unauthorized: open this API through the Telegram Mini App.' },
					corsHeaders,
					401,
				);
			}

			if (request.method === 'GET' && url.pathname === '/api/me') {
				return getMe(currentUser, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/user') {
				return getUser(currentUser, env, corsHeaders);
			}

			if (request.method === 'POST' && url.pathname === '/api/user') {
				return postUser(request, currentUser, env, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/sales/summary') {
				return getSalesSummary(currentUser, url, env, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/sales/today') {
				return getSalesToday(currentUser, env, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/sales/history') {
				return getSalesHistoryRoute(currentUser, url, env, corsHeaders);
			}

			if (request.method === 'POST' && url.pathname === '/api/sales') {
				return postSale(request, currentUser, env, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/admin/users') {
				return getAdminUsers(currentUser, env, corsHeaders);
			}

			const adminScheduleMatch = url.pathname.match(/^\/api\/admin\/users\/(\d+)\/schedule$/);

			if (request.method === 'GET' && adminScheduleMatch) {
				return getAdminUserSchedule(currentUser, adminScheduleMatch[1], env, corsHeaders);
			}

			const saleIdMatch = url.pathname.match(/^\/api\/sales\/([^/]+)$/);

			if (request.method === 'DELETE' && saleIdMatch) {
				return deleteSale(saleIdMatch[1], currentUser, env, corsHeaders);
			}

			return json({ error: 'Endpoint not found.' }, corsHeaders, 404);
		} catch (error) {
			console.error(
				JSON.stringify({
					message: 'Unexpected API error',
					error: error instanceof Error ? error.message : 'Unknown error',
				}),
			);

			return json({ error: 'Internal server error.' }, corsHeaders, 500);
		}
	},
} satisfies ExportedHandler<Env>;

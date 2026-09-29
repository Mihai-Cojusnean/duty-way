import type { Role, StoredShifts, User } from '../types';
import {json} from "../utlis";
import {getSalesHistory} from "./sales";

export async function getAdminUsers(
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	if (!currentUser.is_admin) {
		return json({ error: 'Admin access required.' }, corsHeaders, 403);
	}

	const result = await env.DB.prepare(
		`SELECT telegram_user_id, work_name, role
		 FROM app_users
		 WHERE work_name IS NOT NULL
		 ORDER BY work_name COLLATE NOCASE`,
	).all<{
		telegram_user_id: string;
		work_name: string;
		role: Role;
	}>();

	const users: readonly User[] = result.results.map((row) => ({
		telegram_id: row.telegram_user_id,
		username: '',
		language: '',
		work_name: row.work_name,
		is_admin: row.role === 'admin',
	}));

	return json({ users }, corsHeaders);
}

export async function getAdminUserSchedule(
	currentUser: User,
	telegramId: string,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	if (!currentUser.is_admin) {
		return json({ error: 'Admin access required.' }, corsHeaders, 403);
	}

	const row = await env.DB.prepare(
		`SELECT telegram_user_id, work_name, role
		 FROM app_users
		 WHERE telegram_user_id = ?`,
	)
		.bind(telegramId)
		.first<{
			telegram_user_id: string;
			work_name: string | null;
			role: Role;
		}>();

	if (!row) {
		return json({ error: 'User not found.' }, corsHeaders, 404);
	}

	const stored = (await env.USER_SHIFTS.get<StoredShifts>(telegramId, 'json')) ?? {};

	const user: User = {
		telegram_id: row.telegram_user_id,
		username: '',
		language: '',
		work_name: row.work_name ?? '',
		is_admin: row.role === 'admin',
		shifts: stored.shifts ?? [],
	};

	return json(user, corsHeaders);
}

export async function getAdminUserSalesHistory(
	currentUser: User,
	telegramId: string,
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	if (!currentUser.is_admin) {
		return json({ error: 'Admin access required.' }, corsHeaders, 403);
	}

	const requestedDays = Number(url.searchParams.get('days') ?? '7');
	const days =
		Number.isInteger(requestedDays) && requestedDays >= 1 && requestedDays <= 31 ? requestedDays : 7;

	return json({ days: await getSalesHistory(env, telegramId, days) }, corsHeaders);
}

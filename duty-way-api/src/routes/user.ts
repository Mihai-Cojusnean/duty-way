import type { StoredShifts, User } from '../types';
import {isUserUpdate, json} from "../utlis";

export async function getUser(
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const stored = (await env.USER_SHIFTS.get<StoredShifts>(currentUser.telegram_id, 'json')) ?? {};

	return json({ ...currentUser, shifts: stored.shifts ?? [] }, corsHeaders);
}

export async function postUser(
	request: Request,
	currentUser: User,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response> {
	const body = await request.json().catch(() => null);

	if (!isUserUpdate(body)) {
		return json({ error: 'Invalid request body.' }, corsHeaders, 400);
	}

	const existing = (await env.USER_SHIFTS.get<StoredShifts>(currentUser.telegram_id, 'json')) ?? {};

	const updated: StoredShifts = {
		shifts: body.shifts ?? existing.shifts ?? [],
	};

	await env.USER_SHIFTS.put(currentUser.telegram_id, JSON.stringify(updated));

	return json({ success: true, data: { ...currentUser, shifts: updated.shifts } }, corsHeaders);
}

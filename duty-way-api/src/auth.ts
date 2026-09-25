import type { TelegramInitDataUser, User, Role } from './types';

const textEncoder = new TextEncoder();
const maxInitDataAgeSeconds = 24 * 60 * 60;

export async function authenticateTelegramUser(request: Request, env: Env): Promise<User | null> {
	const initData = request.headers.get('X-Telegram-Init-Data');

	// if (true) {
	// 	return {
	// 		telegram_id: '972344705',
	// 		username: 'Mihai',
	// 		language: 'en',
	// 		work_name: 'Mihail Cojusnean',
	// 		is_admin: true,
	// 	};
	// }

	if (!initData || !env.TELEGRAM_BOT_TOKEN) {
		return null;
	}

	const telegramUser = await validateTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN);

	if (!telegramUser) {
		return null;
	}

	const telegramId = String(telegramUser.id);

	await env.DB.prepare(
		"INSERT OR IGNORE INTO app_users (telegram_user_id, role) VALUES (?, 'user')",
	)
		.bind(telegramId)
		.run();

	const dbUser = await env.DB.prepare(
		'SELECT role, work_name FROM app_users WHERE telegram_user_id = ?',
	)
		.bind(telegramId)
		.first<{ role: Role; work_name: string | null }>();

	return {
		telegram_id: telegramId,
		username: telegramUser.username ?? '',
		language: telegramUser.language_code ?? 'en',
		work_name: dbUser?.work_name ?? '',
		is_admin: dbUser?.role === 'admin',
	};
}

async function validateTelegramInitData(
	initData: string,
	botToken: string,
): Promise<TelegramInitDataUser | null> {
	const parameters = new URLSearchParams(initData);
	const suppliedHash = parameters.get('hash');
	const authDate = Number(parameters.get('auth_date'));

	if (
		!suppliedHash ||
		!Number.isInteger(authDate) ||
		authDate <= 0 ||
		Math.abs(Date.now() / 1000 - authDate) > maxInitDataAgeSeconds
	) {
		return null;
	}

	parameters.delete('hash');

	const dataCheckString = [...parameters.entries()]
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([key, value]) => `${key}=${value}`)
		.join('\n');

	const secretKey = await hmacSha256(textEncoder.encode('WebAppData'), textEncoder.encode(botToken));
	const expectedHash = await hmacSha256(secretKey, textEncoder.encode(dataCheckString));
	const suppliedHashBytes = hexToBytes(suppliedHash);

	if (
		!suppliedHashBytes ||
		suppliedHashBytes.byteLength !== expectedHash.byteLength ||
		!crypto.subtle.timingSafeEqual(suppliedHashBytes, expectedHash)
	) {
		return null;
	}

	const userValue = parameters.get('user');

	if (!userValue) {
		return null;
	}

	try {
		const parsedUser: unknown = JSON.parse(userValue);
		return isTelegramInitDataUser(parsedUser) ? parsedUser : null;
	} catch {
		return null;
	}
}

async function hmacSha256(keyMaterial: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey(
		'raw',
		keyMaterial,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign'],
	);

	return new Uint8Array(await crypto.subtle.sign('HMAC', key, message));
}

function hexToBytes(value: string): Uint8Array | null {
	if (!/^[\da-f]{64}$/i.test(value)) {
		return null;
	}

	const bytes = new Uint8Array(value.length / 2);

	for (let index = 0; index < value.length; index += 2) {
		bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
	}

	return bytes;
}

function isTelegramInitDataUser(value: unknown): value is TelegramInitDataUser {
	return (
		typeof value === 'object' &&
		value !== null &&
		'id' in value &&
		typeof value.id === 'number' &&
		Number.isSafeInteger(value.id) &&
		(!('username' in value) || typeof value.username === 'string') &&
		(!('language_code' in value) || typeof value.language_code === 'string')
	);
}

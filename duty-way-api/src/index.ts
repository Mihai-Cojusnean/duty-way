type Role = 'admin' | 'user';

interface TelegramUser {
	readonly id: number;
	readonly username?: string;
	readonly language_code?: string;
}

interface AuthenticatedUser {
	readonly telegramUser: TelegramUser;
	readonly role: Role;
}

interface UserRecord {
	readonly profile?: {
		readonly telegramId: number;
		readonly username: string;
		readonly language: string;
	};
	readonly interactions?: {
		readonly lastButtonClicked: string;
		readonly lastTextWritten: string;
		readonly updatedAt: string;
	};
	readonly shifts?: readonly unknown[];
}

interface UserUpdate {
	readonly username?: string;
	readonly language?: string;
	readonly buttonClicked?: string;
	readonly textWritten?: string;
	readonly shifts?: readonly unknown[];
}

const textEncoder = new TextEncoder();
const maxInitDataAgeSeconds = 24 * 60 * 60;

export default {
	async fetch(request, env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
				return json(
					{
						telegramUser: currentUser.telegramUser,
						role: currentUser.role,
					},
					corsHeaders,
				);
			}

			if (request.method === 'GET' && url.pathname === '/api/user') {
				const telegramId = String(currentUser.telegramUser.id);
				const userData =
					(await env.USER_SHIFTS.get<UserRecord>(telegramId, 'json')) ?? {};

				return json(userData, corsHeaders);
			}

			if (request.method === 'POST' && url.pathname === '/api/user') {
				const body = await request.json().catch(() => null);

				if (!isUserUpdate(body)) {
					return json({ error: 'Invalid request body.' }, corsHeaders, 400);
				}

				const telegramId = String(currentUser.telegramUser.id);
				const existingData =
					(await env.USER_SHIFTS.get<UserRecord>(telegramId, 'json')) ?? {};

				const updatedData: UserRecord = {
					profile: {
						telegramId: currentUser.telegramUser.id,
						username:
							body.username ??
							existingData.profile?.username ??
							currentUser.telegramUser.username ??
							'',
						language:
							body.language ??
							existingData.profile?.language ??
							currentUser.telegramUser.language_code ??
							'en',
					},
					interactions: {
						lastButtonClicked:
							body.buttonClicked ??
							existingData.interactions?.lastButtonClicked ??
							'',
						lastTextWritten:
							body.textWritten ??
							existingData.interactions?.lastTextWritten ??
							'',
						updatedAt: new Date().toISOString(),
					},
					shifts: body.shifts ?? existingData.shifts ?? [],
				};

				await env.USER_SHIFTS.put(telegramId, JSON.stringify(updatedData));

				return json({ success: true, data: updatedData }, corsHeaders);
			}

			if (request.method === 'GET' && url.pathname === '/api/admin/users') {
				if (currentUser.role !== 'admin') {
					return json({ error: 'Admin access required.' }, corsHeaders, 403);
				}

				const result = await env.DB.prepare(
					'SELECT telegram_user_id, role, created_at FROM app_users ORDER BY created_at DESC LIMIT 100',
				).all<{ telegram_user_id: string; role: Role; created_at: string }>();

				return json({ users: result.results }, corsHeaders);
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

async function authenticateTelegramUser(
	request: Request,
	env: Env,
): Promise<AuthenticatedUser | null> {
	const initData = request.headers.get('X-Telegram-Init-Data');

	if (!initData || !env.TELEGRAM_BOT_TOKEN) {
		return null;
	}

	const telegramUser = await validateTelegramInitData(
		initData,
		env.TELEGRAM_BOT_TOKEN,
	);

	if (!telegramUser) {
		return null;
	}

	const telegramId = String(telegramUser.id);

	// A verified Telegram user starts as a normal user.
	await env.DB.prepare(
		"INSERT OR IGNORE INTO app_users (telegram_user_id, role) VALUES (?, 'user')",
	)
		.bind(telegramId)
		.run();

	const user = await env.DB.prepare(
		'SELECT role FROM app_users WHERE telegram_user_id = ?',
	)
		.bind(telegramId)
		.first<{ role: Role }>();

	return {
		telegramUser,
		role: user?.role === 'admin' ? 'admin' : 'user',
	};
}

async function validateTelegramInitData(
	initData: string,
	botToken: string,
): Promise<TelegramUser | null> {
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

	const secretKey = await hmacSha256(
		textEncoder.encode('WebAppData'),
		textEncoder.encode(botToken),
	);

	const expectedHash = await hmacSha256(
		secretKey,
		textEncoder.encode(dataCheckString),
	);

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
		return isTelegramUser(parsedUser) ? parsedUser : null;
	} catch {
		return null;
	}
}

async function hmacSha256(
	keyMaterial: Uint8Array,
	message: Uint8Array,
): Promise<Uint8Array> {
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

function isTelegramUser(value: unknown): value is TelegramUser {
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

function isUserUpdate(value: unknown): value is UserUpdate {
	return (
		typeof value === 'object' &&
		value !== null &&
		(!('username' in value) || typeof value.username === 'string') &&
		(!('language' in value) || typeof value.language === 'string') &&
		(!('buttonClicked' in value) || typeof value.buttonClicked === 'string') &&
		(!('textWritten' in value) || typeof value.textWritten === 'string') &&
		(!('shifts' in value) || Array.isArray(value.shifts))
	);
}

function json(
	body: unknown,
	corsHeaders: Record<string, string>,
	status = 200,
): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			...corsHeaders,
			'Content-Type': 'application/json; charset=UTF-8',
		},
	});
}

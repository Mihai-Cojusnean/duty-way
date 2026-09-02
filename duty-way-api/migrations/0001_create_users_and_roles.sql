-- Migration number: 0001 	 2026-09-02T09:09:08.688Z
CREATE TABLE app_users (
						   telegram_user_id TEXT PRIMARY KEY,
	                       role TEXT NOT NULL DEFAULT 'user'
							   CHECK (role IN ('admin', 'user')),
	                       created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	                       updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX app_users_role_idx ON app_users (role);

-- After applying this migration, insert your own Telegram ID:
-- INSERT INTO app_users (telegram_user_id, role)
-- VALUES ('YOUR_TELEGRAM_USER_ID', 'admin');

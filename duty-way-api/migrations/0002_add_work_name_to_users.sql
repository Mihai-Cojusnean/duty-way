-- Migration number: 0002 	 2026-09-02T10:41:02.940Z
ALTER TABLE app_users ADD COLUMN work_name TEXT;

CREATE INDEX app_users_work_name_idx
	ON app_users(work_name COLLATE NOCASE);

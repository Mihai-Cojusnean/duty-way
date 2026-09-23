import { ScheduleRecord } from './duty.interface';

export interface User {
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
  readonly shifts?: readonly ScheduleRecord[];
}

export type AppRole = 'admin' | 'user';

export interface CurrentUser {
  readonly telegram_user: User;
  readonly role: AppRole;
  readonly work_name: string;
}

export interface AdminUser {
  readonly telegram_user_id: string;
  readonly work_name: string;
  readonly role: 'admin';
}

export interface ViewedUser {
  readonly telegram_user_id: string;
  readonly work_name: string;
  readonly isSelf: boolean;
  readonly isAdmin: boolean;
}

export interface TelegramUser {
  readonly id: number;
  readonly first_name?: string;
  readonly last_name?: string;
  readonly username?: string;
  readonly language_code?: string;
  readonly allows_write_to_pm?: boolean;
  readonly photo_url?: string;
}

export interface CurrentUser {
  readonly telegramUser: TelegramUser;
  readonly role: AppRole;
  readonly workName: string;
}

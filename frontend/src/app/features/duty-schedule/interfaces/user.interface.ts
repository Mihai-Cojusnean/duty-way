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
  readonly id: string;
  readonly username: string;
  readonly language_code: string;
  readonly work_name: string;
  readonly role: AppRole;
}

export interface AdminUser {
  readonly telegram_user_id: string;
  readonly work_name: string;
  readonly role: 'admin';
}

export interface ViewedUser {
  readonly telegram_user_id: string;
  readonly work_name: string;
}

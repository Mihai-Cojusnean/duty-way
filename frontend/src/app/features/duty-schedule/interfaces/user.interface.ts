import { ScheduleRecord } from './duty.interface';

export type AppRole = 'admin' | 'user';

export interface User {
  readonly profile: {
    readonly telegramId: string;
    readonly username: string;
    readonly language: string;
  };
  readonly work_name: string;
  readonly isAdmin: boolean;
  readonly shifts?: readonly ScheduleRecord[];
}

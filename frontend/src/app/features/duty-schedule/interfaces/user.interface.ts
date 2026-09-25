import { ScheduleRecord } from './duty.interface';

export interface User {
  readonly telegram_id: string;
  readonly username: string;
  readonly language: string;
  readonly work_name: string;
  readonly is_admin: boolean;
  readonly shifts?: readonly ScheduleRecord[];
}

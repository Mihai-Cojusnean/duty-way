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

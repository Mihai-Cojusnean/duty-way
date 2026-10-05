import { ScheduleDiff, ScheduleRecord } from '../interfaces/duty.interface';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ScheduleDiffService {
  compare(previous: readonly ScheduleRecord[], current: readonly ScheduleRecord[]): ScheduleDiff {
    const previousById = new Map(previous.map((record) => [record.id, record]));
    const currentById = new Map(current.map((record) => [record.id, record]));

    const added = current.filter((record) => !previousById.has(record.id));
    const removed = previous.filter((record) => !currentById.has(record.id));

    const changed = current.flatMap((record) => {
      const oldRecord = previousById.get(record.id);

      if (!oldRecord || !this.hasChanged(oldRecord, record)) {
        return [];
      }

      return [{ previous: oldRecord, current: record }];
    });

    return { added, removed, changed };
  }

  private hasChanged(previous: ScheduleRecord, current: ScheduleRecord): boolean {
    return (
      previous.terminal !== current.terminal ||
      previous.brand !== current.brand ||
      previous.date !== current.date ||
      previous.startMinutes !== current.startMinutes ||
      previous.endMinutes !== current.endMinutes
    );
  }
}

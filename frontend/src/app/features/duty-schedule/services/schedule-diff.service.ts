import { Injectable } from '@angular/core';
import { ScheduleDiff, ScheduleRecord } from '../interfaces/duty.interface';

@Injectable({
  providedIn: 'root',
})
export class ScheduleDiffService {
  compare(previous: readonly ScheduleRecord[], current: readonly ScheduleRecord[]): ScheduleDiff {
    const previousByKey = new Map(
      previous.map((record: ScheduleRecord): [string, ScheduleRecord] => [
        this.shiftKey(record),
        record,
      ]),
    );

    const currentByKey = new Map(
      current.map((record: ScheduleRecord): [string, ScheduleRecord] => [
        this.shiftKey(record),
        record,
      ]),
    );

    const added: ScheduleRecord[] = current.filter(
      (record: ScheduleRecord): boolean => !previousByKey.has(this.shiftKey(record)),
    );

    const removed: ScheduleRecord[] = previous.filter(
      (record: ScheduleRecord): boolean => !currentByKey.has(this.shiftKey(record)),
    );

    const changed = current.flatMap((record) => {
      const oldRecord = previousByKey.get(this.shiftKey(record));

      if (!oldRecord || oldRecord.hours === record.hours) {
        return [];
      }

      return [
        {
          previous: oldRecord,
          current: record,
        },
      ];
    });

    return {
      added,
      removed,
      changed,
    };
  }

  private shiftKey(record: ScheduleRecord): string {
    return [record.tabName, record.dateStr, record.brand]
      .map((value) => value.trim().toLowerCase())
      .join('|');
  }
}

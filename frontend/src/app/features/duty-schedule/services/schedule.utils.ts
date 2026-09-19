import { ScheduleRecord, ShiftGroup } from '../interfaces/duty.interface';

export function checkIsPast(dateStr: string): boolean {
  const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);

  shiftDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(shiftDate.getTime()) && shiftDate < today;
}

export function checkIsToday(dateStr: string): boolean {
  const shiftDate = new Date(`${dateStr} ${new Date().getFullYear()}`);

  shiftDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return !Number.isNaN(shiftDate.getTime()) && shiftDate.getTime() === today.getTime();
}

export function prepareScheduleRecords(records: readonly ScheduleRecord[]): ScheduleRecord[] {
  return records.map((record) => ({
    ...record,
    isPast: checkIsPast(record.dateStr),
    isToday: checkIsToday(record.dateStr),
  }));
}

export function groupRecordsByDate(
  records: readonly ScheduleRecord[],
  includeDaysOff = false,
): ShiftGroup[] {
  const groups = new Map<string, ScheduleRecord[]>();

  for (const record of records) {
    const date = record.dateStr.trim();
    const existing = groups.get(date);

    if (existing) {
      existing.push(record);
    } else {
      groups.set(date, [record]);
    }
  }

  const sortedGroups = [...groups.entries()].sort(
    ([, a]: [string, ScheduleRecord[]], [, b]: [string, ScheduleRecord[]]): number =>
      a[0].dateNumber - b[0].dateNumber,
  );

  if (records.some((record: ScheduleRecord): boolean => !record.isPast)) {
    const result: ShiftGroup[] = [];

    const today = new Date();
    const hasShiftToday = records.some((record) => record.isToday);

    if (includeDaysOff && !hasShiftToday) {
      result.push({
        date: `day-off-${today.getTime()}`,
        shifts: [],
        isMultiShift: false,
        isDayOff: true,
        dayLabel: formatDayOffLabel(today),
      });
    }

    for (let i: number = 0; i < sortedGroups.length; i++) {
      const [date, shifts] = sortedGroups[i];

      result.push({
        date,
        shifts,
        isMultiShift: shifts.length > 1,
        isDayOff: false,
        dayLabel: date,
      });

      const next: [string, ScheduleRecord[]] = sortedGroups[i + 1];

      if (!next) {
        continue;
      }

      const currentDate: Date = parseScheduleDate(date);
      const nextDate: Date = parseScheduleDate(next[0]);

      if (includeDaysOff) {
        if (!Number.isNaN(currentDate.getTime()) && !Number.isNaN(nextDate.getTime())) {
          const daysBetween: number = Math.round(
            (nextDate.getTime() - currentDate.getTime()) / 86_400_000,
          );

          for (let day: number = 1; day < daysBetween; day++) {
            const dayOff = new Date(currentDate);
            dayOff.setDate(dayOff.getDate() + day);

            result.push({
              date: `day-off-${dayOff.getTime()}`,
              shifts: [],
              isMultiShift: false,
              isDayOff: true,
              dayLabel: formatDayOffLabel(dayOff),
            });
          }
        }
      }
    }

    return result;
  }

  return sortedGroups.map(([date, shifts]) => ({
    date,
    shifts,
    isMultiShift: shifts.length > 1,
    isDayOff: false,
    dayLabel: date,
  }));
}

function parseScheduleDate(dateStr: string): Date {
  const date = new Date(`${dateStr} ${new Date().getFullYear()}`);

  date.setHours(12, 0, 0, 0);

  return date;
}

function formatDayOffLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

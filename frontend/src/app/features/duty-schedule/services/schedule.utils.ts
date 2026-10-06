import { ISODate, ScheduleRecord, ShiftGroup } from '../interfaces/duty.interface';

export interface GroupScheduleOptions {
  readonly includeDaysOff?: boolean;
}

export function isPast(date: ISODate, today: ISODate = getTodayISO()): boolean {
  return date < today;
}

export function isToday(date: ISODate, today: ISODate = getTodayISO()): boolean {
  return date === today;
}

export function groupRecordsByDate(
  records: readonly ScheduleRecord[],
  options: GroupScheduleOptions = {},
): ShiftGroup[] {
  const { includeDaysOff = false } = options;

  if (records.length === 0) {
    return [];
  }

  const groups = groupByDate(records);
  const sortedGroups = sortGroups(groups);

  if (!includeDaysOff) {
    return sortedGroups.map(([date, shifts]) => createShiftGroup(date, shifts));
  }

  return addDayOffGroups(sortedGroups);
}

function groupByDate(records: readonly ScheduleRecord[]): Map<ISODate, ScheduleRecord[]> {
  const groups = new Map<ISODate, ScheduleRecord[]>();

  for (const record of records) {
    const shifts = groups.get(record.date);

    if (shifts) {
      shifts.push(record);
    } else {
      groups.set(record.date, [record]);
    }
  }

  return groups;
}

function sortGroups(groups: Map<ISODate, ScheduleRecord[]>): [ISODate, ScheduleRecord[]][] {
  return [...groups.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
}

function createShiftGroup(date: ISODate, shifts: readonly ScheduleRecord[]): ShiftGroup {
  return {
    date,
    shifts,
    isMultiShift: shifts.length > 1,
    isDayOff: false,
    dayLabel: formatScheduleDate(date),
  };
}

function addDayOffGroups(groups: readonly [ISODate, ScheduleRecord[]][]): ShiftGroup[] {
  if (groups.length === 0) {
    return [];
  }

  const result: ShiftGroup[] = [];

  for (let index = 0; index < groups.length; index++) {
    const [currentDate, shifts] = groups[index];

    result.push(createShiftGroup(currentDate, shifts));

    const nextGroup = groups[index + 1];

    if (!nextGroup) {
      continue;
    }

    const nextDate = nextGroup[0];

    for (let date = addDays(currentDate, 1); date < nextDate; date = addDays(date, 1)) {
      result.push(createDayOffGroup(date));
    }
  }

  return result;
}

function createDayOffGroup(date: ISODate): ShiftGroup {
  return {
    date,
    shifts: [],
    isMultiShift: false,
    isDayOff: true,
    dayLabel: formatScheduleDate(date),
  };
}

function addDays(date: ISODate, days: number): ISODate {
  const parsed = parseISODate(date);

  parsed.setDate(parsed.getDate() + days);

  return formatISODate(parsed);
}

function parseISODate(date: ISODate): Date {
  const [year, month, day] = date.split('-').map(Number);

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function formatISODate(date: Date): ISODate {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}` as ISODate;
}

function getTodayISO(): ISODate {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}` as ISODate;
}

export const TERMINAL_NAMES: Readonly<Record<string, string>> = {
  'CDG1 - LAP1 (T1)': 'T1',
  'CDG2 - LACM (AC)': 'AC',
  'CDG2 - LEP1 (TE) porte K': 'K',
  'CDG2 -LSM7_LSM8 ( S3) porte L': 'L',
  'CDG2 - LSM4 (S4) porte M': 'M',
  'CDG2 - LFM5_LFM6 (TF)': 'F',
};

export function getTerminalName(terminal: string): string {
  const normalized = terminal.trim();

  return TERMINAL_NAMES[normalized] ?? normalized;
}

export function shiftKey(record: ScheduleRecord): string {
  return [
    record.terminal.trim().toLowerCase(),
    record.date,
    record.brand.trim().toLowerCase(),
    String(record.startMinutes),
  ].join('|');
}

export function findCurrentShift(
  records: readonly ScheduleRecord[],
  now: Date = new Date(),
): ScheduleRecord | null {
  const today =
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}` as ISODate;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    records.find(
      (record) =>
        record.date === today &&
        nowMinutes >= record.startMinutes &&
        nowMinutes < record.endMinutes,
    ) ?? null
  );
}

export function formatShiftHours(record: ScheduleRecord): string {
  const format = (minutes: number) =>
    `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

  return `${format(record.startMinutes)}-${format(record.endMinutes)}`;
}

export function formatScheduleDate(date: ISODate): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseISODate(date));
}

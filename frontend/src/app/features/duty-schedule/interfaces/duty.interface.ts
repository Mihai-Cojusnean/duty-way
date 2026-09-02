export interface ScheduleRecord {
  readonly id: string;
  readonly tabName: string;
  readonly brand: string;
  readonly day: string;
  readonly dateStr: string;
  readonly dateNumber: number;
  readonly startHourMinutes: number;
  readonly hours: string;
  readonly person: string;
  readonly isPast?: boolean;
  readonly isToday?: boolean;
}

export interface Perfume {
  readonly id: string;
  readonly name: string;
  readonly prices: readonly PerfumePrice[];
  readonly creator: string;
  readonly collection: string;
  readonly description: string;
  readonly notes: string;
  readonly longevity: string;
  readonly sillage: string;
  readonly imageUrl?: string;
  readonly pros: readonly string[];
}

export interface PerfumePrice {
  readonly id: string;
  readonly label: string;
  readonly amountCents: number;
  readonly currency: 'EUR';
}

export interface PerfumeSale {
  readonly perfume: Perfume;
  readonly price: PerfumePrice;
}

export type CatalogMap = Record<string, Perfume[]>;

export interface ChangedShift {
  readonly previous: ScheduleRecord;
  readonly current: ScheduleRecord;
}

export interface ScheduleDiff {
  readonly added: readonly ScheduleRecord[];
  readonly removed: readonly ScheduleRecord[];
  readonly changed: readonly ChangedShift[];
}

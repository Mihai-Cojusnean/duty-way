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
  readonly label: string;
  readonly amountCents: number;
  readonly currency: 'EUR';
}

export interface PerfumeSale {
  readonly perfume: Perfume;
  readonly price: PerfumePrice;
  readonly brand: string;
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

export interface Sale {
  readonly id: string;
  readonly brand: string;
  readonly perfume: SoldPerfume;
  readonly price: PerfumePrice;
  readonly soldAt: Date;
  readonly soldBy: string;
}

export interface SalesSummary {
  readonly count: number;
  readonly totalCents: number;
  readonly currency: 'EUR';
}

export interface SalesHistoryEntry {
  readonly date: string;
  readonly count: number;
  readonly totalCents: number;
  readonly currency: 'EUR';
}

export interface RecordSaleResponse {
  readonly id: string;
  readonly summary: SalesSummary;
}

export interface SoldPerfume {
  readonly id: string;
  readonly name: string;
}

export interface ShiftGroup {
  date: string;
  shifts: ScheduleRecord[];
  isMultiShift: boolean;
  isDayOff: boolean;
  dayLabel: string;
}

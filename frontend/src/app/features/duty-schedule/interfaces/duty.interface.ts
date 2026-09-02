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
  readonly price?: string | number | PerfumePrice[];
  readonly creator: string;
  readonly collection: string;
  readonly description: string;
  readonly notes: string;
  readonly longevity: string;
  readonly sillage: string;
  readonly imageUrl?: string;
  readonly pros: string[];
}

export interface PerfumePrice {
  label?: string;
  amount: number;
}

export type CatalogMap = Record<string, Perfume[]>;

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import {
  BrandCatalogCollection,
  Perfume,
  PerfumePrice,
  ScheduleRecord,
} from '../../interfaces/duty.interface';
import { PerfumeModalComponent } from '../perfume-modal/perfume-modal.component';
import { CatalogService } from '../../services/catalog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { SalesStore } from '../../services/sales.store';
import { CurrencyPipe } from '@angular/common';
import { TodaySales } from './today-sales/today-sales';
import { UserService } from '../../../../core/user.service';
import { findCurrentShift, shiftKey } from '../../services/schedule.utils';

@Component({
  selector: 'app-brand-catalog',
  standalone: true,
  imports: [PerfumeModalComponent, CurrencyPipe, TodaySales],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-catalog.component.html',
  styleUrl: './brand-catalog.component.css',
})
export class BrandCatalogComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  private readonly salesStore = inject(SalesStore);
  private readonly userService = inject(UserService);

  protected readonly salesOpen = signal(false);
  readonly soldTodayCount = this.salesStore.soldTodayCount;
  readonly todaySalesTotalCents = this.salesStore.todaySalesTotalCents;
  readonly selectedPerfume = signal<Perfume | null>(null);
  readonly searchQuery = signal<string>('');
  readonly addedSale = signal<string | null>(null);
  readonly expandedCollection = signal<string | null>(null);

  protected readonly brandName = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('brand')?.trim() ?? '')),
    { initialValue: '' },
  );

  private readonly mySchedule = resource({
    loader: () => firstValueFrom(this.userService.getUserSchedule()),
  });

  private readonly currentShift = computed<ScheduleRecord | null>(() => {
    const shifts = this.mySchedule.value()?.shifts;
    return shifts ? findCurrentShift(shifts) : null;
  });

  readonly catalog = resource<BrandCatalogCollection[], { brand: string } | undefined>({
    params: () => {
      const brand = this.brandName().trim();
      return brand ? { brand } : undefined;
    },
    defaultValue: [],
    loader: ({ params }) => this.catalogService.getBrandCatalog(params.brand),
  });

  readonly collections = computed(() => {
    const rawCollections = this.catalog.value() ?? [];
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) {
      return rawCollections;
    }

    return rawCollections
      .map((col) => ({
        ...col,
        parfums: col.parfums.filter((p) =>
          `${p.name} ${p.creator} ${p.notes}`.toLowerCase().includes(query),
        ),
      }))
      .filter((col) => col.parfums.length > 0);
  });

  protected openPerfume(perfume: Perfume): void {
    this.selectedPerfume.set(perfume);
  }

  toggleCollection(name: string): void {
    this.expandedCollection.update((curr) => (curr === name ? null : name));
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  addSale(perfume: Perfume, price: PerfumePrice): void {
    const shift = this.currentShift();

    this.salesStore.recordSale({
      perfume,
      price,
      brand: this.brandName(),
      shiftKey: shift ? shiftKey(shift) : '',
    });

    const key = `${perfume.id}-${price.label}`;
    this.addedSale.set(key);

    setTimeout(() => {
      if (this.addedSale() === key) {
        this.addedSale.set(null);
      }
    }, 500);
  }

  protected openSales(): void {
    this.salesOpen.set(true);
  }

  protected closeSales(): void {
    this.salesOpen.set(false);
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/']);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CatalogMap, Perfume } from '../features/duty-schedule/interfaces/duty.interface';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly catalogUrl = 'data/parfumes.json';

  private catalog: CatalogMap | null = null;

  async getCatalog(): Promise<CatalogMap> {
    if (this.catalog) {
      return this.catalog;
    }

    this.catalog = await firstValueFrom(this.http.get<CatalogMap>(this.catalogUrl));

    return this.catalog;
  }

  async getBrandPerfumes(brand: string): Promise<Perfume[]> {
    const catalog = await this.getCatalog();

    return catalog[brand] ?? [];
  }
}

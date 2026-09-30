import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BrandCatalogCollection } from '../interfaces/duty.interface';

export type CatalogMap = Record<string, BrandCatalogCollection[]>;

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

  async getBrandCatalog(brand: string): Promise<BrandCatalogCollection[]> {
    const catalog = await this.getCatalog();

    return catalog[brand] ?? [];
  }
}

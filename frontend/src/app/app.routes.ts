import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/duty-schedule/containers/duty-schedule-page.component').then(
        (m) => m.DutySchedulePageComponent,
      ),
  },
  {
    path: 'brand-catalog/:brand',
    loadComponent: () =>
      import('./features/duty-schedule/components/brand-catalog/brand-catalog.component').then(
        (m) => m.BrandCatalogComponent,
      ),
  },
];

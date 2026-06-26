import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'merchants', pathMatch: 'full' },
  {
    path: 'merchants',
    loadComponent: () => import('./merchants/merchant-list.component').then(m => m.MerchantListComponent),
  },
  {
    path: 'merchants/:id',
    loadComponent: () => import('./merchants/merchant-detail.component').then(m => m.MerchantDetailComponent),
  },
  {
    path: 'batches/:id',
    loadComponent: () => import('./batches/batch-settle.component').then(m => m.BatchSettleComponent),
  },
];

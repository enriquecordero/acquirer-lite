import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService, MerchantDetail, BatchList } from '../services/api.service';

@Component({
  selector: 'app-merchant-detail',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    @if (merchant(); as m) {
      <div class="back"><a routerLink="/merchants">‹ Merchants</a></div>

      <div class="detail-header">
        <div>
          <h1>{{ m.legalName }}</h1>
          <span class="code">{{ m.merchantCode }}</span>
          <span class="badge" [class]="'badge-' + m.status.toLowerCase()">{{ m.status }}</span>
        </div>
      </div>

      <div class="tabs">
        <button [class.active]="tab() === 'terminals'" (click)="tab.set('terminals')">Terminals</button>
        <button [class.active]="tab() === 'batches'" (click)="tab.set('batches'); loadBatches()">Batches</button>
      </div>

      @if (tab() === 'terminals') {
        <table>
          <thead><tr><th>Code</th><th>Status</th></tr></thead>
          <tbody>
            @for (t of m.terminals; track t.id) {
              <tr>
                <td>{{ t.terminalCode }}</td>
                <td>
                  <span class="badge" [class]="'badge-' + t.status.toLowerCase()">{{ t.status }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }

      @if (tab() === 'batches') {
        @if (batches().length) {
          <table>
            <thead><tr><th>Batch</th><th>Date</th><th>Status</th><th>Total</th><th>Captured</th><th></th></tr></thead>
            <tbody>
              @for (b of batches(); track b.id) {
                <tr>
                  <td>#{{ b.id }}</td>
                  <td>{{ b.batchDate }}</td>
                  <td>
                    <span class="badge" [class]="'badge-' + b.status.toLowerCase()">{{ b.status }}</span>
                  </td>
                  <td>{{ b.totalAmount | number:'1.2-2' }}</td>
                  <td>{{ b.capturedCount }}</td>
                  <td>
                    @if (b.status === 'Open') {
                      <a [routerLink]="['/batches', b.id]" class="btn btn-primary">Settle →</a>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty">No batches.</p>
        }
      }
    }
  `,
  styles: [`
    .back { margin-bottom: 16px; }
    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    h1 { font-size: 22px; margin-bottom: 4px; }
    .code { color: var(--muted); margin-right: 8px; }
    .tabs { display: flex; gap: 0; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
    .tabs button { padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--muted); border-bottom: 2px solid transparent; }
    .tabs button.active { color: var(--primary); border-bottom-color: var(--primary); }
    .empty { padding: 40px; text-align: center; color: var(--muted); }
  `],
})
export class MerchantDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  merchant = signal<MerchantDetail | null>(null);
  batches = signal<BatchList[]>([]);
  tab = signal<'terminals' | 'batches'>('terminals');

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getMerchant(id).subscribe(m => this.merchant.set(m));
  }

  loadBatches() {
    const m = this.merchant();
    if (!m) return;
    this.api.getBatches(m.id).subscribe(b => this.batches.set(b));
  }
}

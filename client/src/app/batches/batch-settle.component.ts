import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { ApiService, BatchDetail } from '../services/api.service';

@Component({
  selector: 'app-batch-settle',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    @if (batch(); as b) {
      <div class="settle-card card">
        <div class="settle-header">
          <h2>Settle Batch #{{ b.id }}</h2>
          <div class="meta">
            <span>Merchant: {{ b.merchantName }} ({{ b.merchantCode }})</span>
            <span>Date: {{ b.batchDate }}</span>
          </div>
        </div>

        <h3>Transactions to settle (Status = Captured)</h3>

        <table>
          <thead>
            <tr>
              <th>TXN</th>
              <th>Terminal</th>
              <th>AuthCode</th>
              <th>Card Ref</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            @for (t of b.transactions; track t.id) {
              <tr>
                <td>{{ t.id }}</td>
                <td>{{ t.terminalCode }}</td>
                <td>{{ t.authCode }}</td>
                <td class="token">{{ t.cardRef }}</td>
                <td class="right">\$ {{ t.amount | number:'1.2-2' }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="summary">
          <span>{{ b.transactions.length }} txns</span>
          <span class="total">TOTAL \$ {{ b.total | number:'1.2-2' }}</span>
        </div>

        @if (b.status === 'Open') {
          <div class="warning">
            ⚠ Closes the batch and marks all txns as Settled.
          </div>
          <div class="actions">
            <a [routerLink]="['/merchants', b.merchantId]" class="btn">Cancel</a>
            <button class="btn btn-primary" (click)="settle()" [disabled]="settling()">
              @if (settling()) { Settling… } @else { Confirm Settle ✓ }
            </button>
          </div>
        } @else {
          <div class="settled-msg">✓ Batch settled</div>
        }
      </div>
    }
  `,
  styles: [`
    .settle-card { max-width: 800px; margin: 0 auto; }
    .settle-header { margin-bottom: 20px; }
    h2 { font-size: 20px; margin-bottom: 8px; }
    h3 { font-size: 14px; color: var(--muted); margin-bottom: 12px; }
    .meta { display: flex; gap: 24px; color: var(--muted); font-size: 14px; }
    .right { text-align: right; }
    .token { font-family: monospace; color: var(--muted); }
    .summary { display: flex; justify-content: space-between; padding: 16px; font-weight: 500; }
    .total { font-size: 18px; }
    .warning { padding: 12px 16px; background: #fef7e0; border-radius: var(--radius); color: #5f4b08; font-size: 14px; margin-bottom: 16px; }
    .actions { display: flex; justify-content: flex-end; gap: 12px; }
    .settled-msg { padding: 16px; text-align: center; color: var(--success); font-weight: 600; font-size: 16px; }
  `],
})
export class BatchSettleComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  batch = signal<BatchDetail | null>(null);
  settling = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getBatch(id).subscribe(b => this.batch.set(b));
  }

  settle() {
    const b = this.batch();
    if (!b) return;
    this.settling.set(true);
    this.api.settleBatch(b.id).subscribe({
      next: result => {
        this.batch.set(result);
        this.settling.set(false);
      },
      error: () => this.settling.set(false),
    });
  }
}

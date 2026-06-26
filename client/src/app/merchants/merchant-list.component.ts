import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, MerchantList } from '../services/api.service';

@Component({
  selector: 'app-merchant-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="header">
      <h1>Merchants</h1>
    </div>

    <div class="filters card">
      <input
        type="text"
        placeholder="Search merchant…"
        [ngModel]="search()"
        (ngModelChange)="search.set($event); loadMerchants()" />
      <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); loadMerchants()">
        <option value="">All</option>
        <option value="Active">Active</option>
        <option value="Suspended">Suspended</option>
        <option value="Closed">Closed</option>
      </select>
    </div>

    @if (merchants().length) {
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Legal Name</th>
            <th>Terminals</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (m of merchants(); track m.id) {
            <tr>
              <td>{{ m.merchantCode }}</td>
              <td>{{ m.legalName }}</td>
              <td>{{ m.terminalCount }}</td>
              <td>
                <span class="badge" [class]="'badge-' + m.status.toLowerCase()">
                  {{ m.status }}
                </span>
              </td>
              <td><a [routerLink]="['/merchants', m.id]">View →</a></td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <p class="empty">No merchants found.</p>
    }
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    h1 { font-size: 24px; }
    .filters { display: flex; gap: 12px; margin-bottom: 20px; }
    .filters input { flex: 1; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; }
    .filters select { padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 14px; }
    .empty { padding: 40px; text-align: center; color: var(--muted); }
  `],
})
export class MerchantListComponent implements OnInit {
  private api = inject(ApiService);

  merchants = signal<MerchantList[]>([]);
  search = signal('');
  statusFilter = signal('');

  ngOnInit() {
    this.loadMerchants();
  }

  loadMerchants() {
    this.api.getMerchants(this.search(), this.statusFilter() || undefined)
      .subscribe(data => this.merchants.set(data));
  }
}

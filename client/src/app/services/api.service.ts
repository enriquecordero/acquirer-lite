import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface MerchantList {
  id: number;
  merchantCode: string;
  legalName: string;
  terminalCount: number;
  status: string;
}

export interface TerminalInfo {
  id: number;
  terminalCode: string;
  status: string;
}

export interface MerchantDetail {
  id: number;
  merchantCode: string;
  legalName: string;
  status: string;
  onboardedAt: string;
  terminals: TerminalInfo[];
}

export interface TransactionInfo {
  id: number;
  terminalId: number;
  terminalCode: string;
  amount: number;
  currency: string;
  cardRef: string;
  authCode: string;
  status: string;
  batchId: number | null;
  createdAt: string;
}

export interface BatchList {
  id: number;
  batchDate: string;
  status: string;
  totalAmount: number;
  settledAt: string | null;
  capturedCount: number;
}

export interface BatchTransaction {
  id: number;
  terminalCode: string;
  authCode: string;
  cardRef: string;
  amount: number;
}

export interface BatchDetail {
  id: number;
  merchantId: number;
  merchantName: string;
  merchantCode: string;
  batchDate: string;
  status: string;
  transactions: BatchTransaction[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getMerchants(search?: string, status?: string) {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<MerchantList[]>('/api/merchants', { params });
  }

  getMerchant(id: number) {
    return this.http.get<MerchantDetail>(`/api/merchants/${id}`);
  }

  getTransactions(merchantId: number, status?: string) {
    let params = new HttpParams().set('merchantId', merchantId);
    if (status) params = params.set('status', status);
    return this.http.get<TransactionInfo[]>('/api/transactions', { params });
  }

  getBatches(merchantId: number) {
    return this.http.get<BatchList[]>('/api/batches', { params: { merchantId } });
  }

  getBatch(id: number) {
    return this.http.get<BatchDetail>(`/api/batches/${id}`);
  }

  // TODO (Día 2): Implementar settleBatch(id) — POST /api/batches/{id}/settle
}

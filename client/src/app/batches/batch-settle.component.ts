import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-batch-settle',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 20px;">
      <h2>Settle Batch</h2>
      <p style="color: var(--muted); margin: 16px 0;">
        Este componente se construye en el Día 2 del workshop.
      </p>
      <p style="color: var(--muted); font-size: 14px;">
        Debe mostrar las transacciones Captured del batch,
        el total, y un botón para confirmar la liquidación.
      </p>
      <a routerLink="/merchants" class="btn" style="margin-top: 24px;">← Volver a Merchants</a>
    </div>
  `,
})
export class BatchSettleComponent {}

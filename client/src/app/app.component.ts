import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="container nav-inner">
        <a routerLink="/" class="brand">AcquirerLite</a>
        <div class="nav-links">
          <a routerLink="/merchants" routerLinkActive="active">Merchants</a>
        </div>
      </div>
    </nav>
    <main class="container main-content">
      <router-outlet />
    </main>
  `,
  styles: [`
    .navbar { background: white; border-bottom: 1px solid var(--border); padding: 0 0; }
    .nav-inner { display: flex; align-items: center; height: 56px; gap: 32px; }
    .brand { font-size: 18px; font-weight: 700; color: var(--primary); }
    .nav-links { display: flex; gap: 20px; }
    .nav-links a { color: var(--muted); font-weight: 500; font-size: 14px; padding: 16px 0; border-bottom: 2px solid transparent; }
    .nav-links a.active { color: var(--primary); border-bottom-color: var(--primary); }
    .main-content { padding-top: 32px; padding-bottom: 48px; }
  `],
})
export class AppComponent {}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { PublicNavbarComponent } from './public-navbar.component';
import { PublicFooterComponent } from './public-footer.component';
import { ToastStackComponent } from '../ui/toast-stack.component';
import { CookieBannerComponent } from '../ui/cookie-banner.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, PublicNavbarComponent, PublicFooterComponent, ToastStackComponent, CookieBannerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen flex-col overflow-x-hidden" style="background-color: var(--tx-body-bg)">
      <app-public-navbar />
      <main class="flex-1">
        <router-outlet />
      </main>
      <app-public-footer />
      <app-toast-stack />
      <app-cookie-banner />
    </div>
  `,
})
export class PublicLayoutComponent {
  private router = inject(Router);

  constructor() {
    // Sobe a página a cada navegação, como o ScrollToTop da referência React.
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => window.scrollTo({ top: 0 }));
  }
}

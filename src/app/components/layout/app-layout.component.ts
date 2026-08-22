import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiService } from '../../core/services/ui.service';
import { AppSidebarComponent } from './app-sidebar.component';
import { AppHeaderComponent } from './app-header.component';
import { AppFooterComponent } from './app-footer.component';
import { ToastStackComponent } from '../ui/toast-stack.component';

@Component({
  selector: 'app-app-layout',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, AppHeaderComponent, AppFooterComponent, ToastStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex h-screen overflow-hidden" style="background-color: var(--tx-body-bg)">
      <app-app-sidebar />

      @if (ui.sidebarMobileOpen()) {
        <div class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" (click)="ui.toggleSidebarMobile(false)"></div>
      }

      <div class="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <app-app-header />
        <main class="flex-1">
          <div class="mx-auto w-full max-w-screen-2xl p-4 md:p-6 2xl:p-10">
            <router-outlet />
          </div>
        </main>
        <app-app-footer />
      </div>

      <app-toast-stack />
    </div>
  `,
})
export class AppLayoutComponent {
  ui = inject(UiService);
}

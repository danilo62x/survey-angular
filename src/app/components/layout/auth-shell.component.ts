import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { IconComponent } from '../ui/icon-base.component';

/** Casca em branco das telas de autenticação. */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      *transloco="let t"
      class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-10 dark:from-gray-900 dark:via-gray-dark dark:to-gray-900"
    >
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl dark:bg-brand-500/10"></div>
        <div class="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-warning-100/60 blur-3xl dark:bg-brand-700/10"></div>
      </div>

      <div class="w-full max-w-md">
        <div class="mb-6 flex flex-col items-center">
          <a
            routerLink="/"
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-theme-md"
          >
            <app-icon name="clipboard-list" [size]="26" />
          </a>
          <h1 class="mt-5 text-center text-title-sm font-bold text-heading">{{ title }}</h1>
          <p class="mt-2 text-center text-sm text-muted">{{ subtitle }}</p>
        </div>

        <div class="surface-card rounded-2xl border p-6 shadow-theme-md md:p-8"><ng-content /></div>

        @if (hasFooter) {
          <p class="mt-6 text-center text-sm text-muted"><ng-content select="[authFooter]" /></p>
        }

        <p class="mt-6 text-center text-xs text-muted">
          <a routerLink="/" class="hover:text-brand-500">← {{ t('brand') }}</a>
        </p>
      </div>
    </div>
  `,
})
export class AuthShellComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() hasFooter = false;
}

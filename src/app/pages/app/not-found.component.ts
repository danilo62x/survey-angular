import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { setLiteralTitle } from '../../core/page-title';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../components/ui/icon-base.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex min-h-screen flex-col items-center justify-center px-4 text-center"
      style="background-color: var(--tx-body-bg)"
      *transloco="let t"
    >
      <span
        class="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-50 text-brand-500 dark:bg-brand-500/15"
      >
        <app-icon name="clipboard-list" [size]="40" />
      </span>
      <p class="mt-8 text-title-lg font-bold text-heading">404</p>
      <h1 class="mt-2 text-xl font-semibold text-heading">{{ t('notFound.title') }}</h1>
      <p class="mt-2 max-w-md text-sm text-muted">{{ t('notFound.desc') }}</p>
      <a
        [routerLink]="auth.isAuthenticated() ? '/app' : '/'"
        class="mt-8 flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-medium text-white transition hover:bg-brand-600"
      >
        <app-icon name="arrow-right" [size]="16" />
        {{ auth.isAuthenticated() ? t('notFound.back') : t('notFound.home') }}
      </a>
    </div>
  `,
})
export class NotFoundPageComponent {
  auth = inject(AuthService);

  constructor() {
    setLiteralTitle('404');
  }
}

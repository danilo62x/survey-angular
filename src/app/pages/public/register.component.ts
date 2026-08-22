import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../../components/ui/icon-base.component';
import { AuthShellComponent } from '../../components/layout/auth-shell.component';

const INPUT =
  'focus-ring h-11 w-full rounded-lg border border-themed bg-gray-50 px-3 text-sm text-body outline-none focus:border-brand-300 dark:bg-gray-900';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [FormsModule, RouterLink, TranslocoModule, IconComponent, AuthShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-auth-shell
      *transloco="let t"
      [title]="t('auth.registerTitle')"
      [subtitle]="t('auth.registerSubtitle')"
      [hasFooter]="true"
    >
      <form (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="mb-2 block text-sm font-medium text-heading">{{ t('auth.name') }}</label>
          <input required name="name" [(ngModel)]="name" [class]="input" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-heading">{{ t('auth.organization') }}</label>
          <input name="org" [(ngModel)]="org" [class]="input" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-heading">{{ t('auth.email') }}</label>
          <input required type="email" name="email" [(ngModel)]="email" [class]="input" />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-heading">{{ t('auth.password') }}</label>
          <input required type="password" name="password" [(ngModel)]="password" placeholder="••••••••" [class]="input" />
        </div>
        <label class="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            required
            name="accepted"
            [(ngModel)]="accepted"
            class="h-4 w-4 rounded border-themed accent-brand-500"
          />
          {{ t('auth.terms') }}
        </label>
        <button
          type="submit"
          [disabled]="loading()"
          class="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
        >
          @if (loading()) {
            <span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
          } @else {
            <app-icon name="check" [size]="18" />
            {{ t('auth.registerCta') }}
          }
        </button>
      </form>

      <ng-container authFooter>
        {{ t('auth.hasAccount') }}
        <a routerLink="/login" class="font-medium text-brand-500 hover:text-brand-600">{{ t('auth.loginLink') }}</a>
      </ng-container>
    </app-auth-shell>
  `,
})
export class RegisterPageComponent {
  private auth = inject(AuthService);
  private ui = inject(UiService);
  private router = inject(Router);
  private transloco = inject(TranslocoService);

  constructor() {
    usePageTitle('auth.registerTitle');
  }

  protected readonly input = INPUT;
  name = '';
  org = '';
  email = '';
  password = '';
  accepted = false;
  readonly loading = signal(false);

  async submit() {
    this.loading.set(true);
    const ok = await this.auth.register(this.name, this.email, this.password);
    this.loading.set(false);
    if (ok) {
      this.ui.notifySuccess(this.transloco.translate('auth.registerSuccess'));
      this.router.navigateByUrl('/app');
    }
  }
}

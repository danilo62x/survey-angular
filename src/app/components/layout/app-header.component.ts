import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { UiService } from '../../core/services/ui.service';
import { AuthService } from '../../core/services/auth.service';
import { SurveyService } from '../../core/services/survey.service';
import { IconComponent } from '../ui/icon-base.component';
import { LanguageSwitcherComponent } from '../ui/language-switcher.component';
import { latestResponses, surveyById } from '../../core/data/query';
import { usePlural } from '../../lib/i18n';

@Component({
  selector: 'app-app-header',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:click)': 'onDocumentClick($event)' },
  template: `
    <header class="surface-header sticky top-0 z-30 flex w-full border-b" *transloco="let t">
      <div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
            (click)="onToggleSidebar()"
            [attr.aria-label]="t('appNav.collapse')"
          >
            <app-icon name="menu" [size]="20" />
          </button>

          <a
            routerLink="/app/formularios"
            [queryParams]="{ novo: '1' }"
            class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex"
          >
            <app-icon name="plus" [size]="18" />
            {{ t('forms.new') }}
          </a>
        </div>

        <div class="flex items-center gap-2">
          <a
            routerLink="/app/modelos"
            class="hidden h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm text-muted transition hover:bg-gray-50 md:flex dark:hover:bg-gray-800"
          >
            <app-icon name="layers" [size]="16" />
            {{ t('appNav.templates') }}
          </a>
          <app-language-switcher />
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
            (click)="ui.toggleDarkMode()"
            [attr.aria-label]="t('common.theme')"
          >
            <app-icon [name]="ui.darkMode() ? 'sun' : 'moon'" [size]="18" />
          </button>

          <div class="relative" data-dropdown="notif">
            <button
              type="button"
              class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800"
              [attr.aria-label]="t('appNav.notifications')"
              (click)="notifOpen.set(!notifOpen())"
            >
              <app-icon name="bell" [size]="18" />
              @if (notifications().length > 0) {
                <span class="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"
                  ></span>
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span>
                </span>
              }
            </button>
            @if (notifOpen()) {
              <div class="surface-card absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] rounded-xl border shadow-theme-lg">
                <div class="flex items-center justify-between border-b border-themed px-4 py-3">
                  <p class="text-sm font-semibold text-heading">{{ t('appNav.notifications') }}</p>
                </div>
                <ul class="max-h-72 divide-y divide-themed overflow-y-auto">
                  @for (n of notifications(); track n.id) {
                    <li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <span
                        [class]="
                          'mt-1 flex h-2 w-2 shrink-0 rounded-full ' +
                          (n.completed ? 'bg-success-500' : 'bg-warning-500')
                        "
                      ></span>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium text-heading">
                          {{
                            t(n.completed ? 'notifications.newResponse' : 'notifications.partial', { name: n.title })
                          }}
                        </p>
                        <p class="text-xs text-muted">{{ t(relativeKey(n.at), { count: relativeCount(n.at) }) }}</p>
                      </div>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          <div class="relative" data-dropdown="user">
            <button type="button" class="ml-1 flex items-center gap-3" (click)="dropdownOpen.set(!dropdownOpen())">
              <span class="hidden text-right lg:block">
                <span class="block text-sm font-medium text-heading">{{ auth.user()?.name || t('common.guest') }}</span>
                <span class="block text-xs text-muted">{{ auth.user()?.role || '—' }}</span>
              </span>
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-white"
              >
                {{ initials() }}
              </span>
              <app-icon name="chevron-down" [size]="16" class="text-muted" />
            </button>

            @if (dropdownOpen()) {
              <div class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg">
                <div class="border-b border-themed px-4 py-3">
                  <p class="truncate text-sm font-medium text-heading">{{ auth.user()?.name || t('common.guest') }}</p>
                  <p class="truncate text-xs text-muted">{{ auth.user()?.email || '' }}</p>
                </div>
                <ul class="py-1">
                  <li>
                    <a
                      routerLink="/app/configuracoes"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800"
                      (click)="dropdownOpen.set(false)"
                    >
                      <app-icon name="settings" [size]="16" /> {{ t('appNav.settings') }}
                    </a>
                  </li>
                  <li>
                    <a
                      routerLink="/"
                      class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800"
                      (click)="dropdownOpen.set(false)"
                    >
                      <app-icon name="globe" [size]="16" /> {{ t('appNav.viewSite') }}
                    </a>
                  </li>
                </ul>
                <div class="border-t border-themed py-1">
                  <button
                    type="button"
                    class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
                    (click)="logout()"
                  >
                    <app-icon name="logout" [size]="16" /> {{ t('appNav.logout') }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class AppHeaderComponent {
  ui = inject(UiService);
  auth = inject(AuthService);
  private data = inject(SurveyService);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private pl = usePlural();

  readonly dropdownOpen = signal(false);
  readonly notifOpen = signal(false);

  readonly notifications = computed(() =>
    latestResponses(this.data.responses(), 4).map((r) => ({
      id: r.id,
      title: surveyById(this.data.surveys(), r.surveyId)?.title ?? '',
      at: r.at,
      completed: r.completed,
    }))
  );

  readonly initials = computed(() => {
    const user = this.auth.user();
    if (!user) return '?';
    return user.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('');
  });

  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const root = this.host.nativeElement as HTMLElement;
    const notif = root.querySelector('[data-dropdown="notif"]');
    const user = root.querySelector('[data-dropdown="user"]');
    if (notif && !notif.contains(target)) this.notifOpen.set(false);
    if (user && !user.contains(target)) this.dropdownOpen.set(false);
  }

  onToggleSidebar() {
    if (window.innerWidth < 1024) this.ui.toggleSidebarMobile();
    else this.ui.toggleSidebar();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
    this.dropdownOpen.set(false);
  }

  private diff(iso: string) {
    return Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  }

  relativeCount(iso: string): number {
    const diff = this.diff(iso);
    if (diff < 60) return Math.max(1, diff);
    if (diff < 60 * 24) return Math.round(diff / 60);
    return Math.round(diff / (60 * 24));
  }

  relativeKey(iso: string): string {
    const diff = this.diff(iso);
    const base = diff < 60 ? 'time.minutes' : diff < 60 * 24 ? 'time.hours' : 'time.days';
    return this.pl(base, this.relativeCount(iso));
  }
}

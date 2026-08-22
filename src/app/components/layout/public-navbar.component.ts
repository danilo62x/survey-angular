import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { TranslocoModule } from '@jsverse/transloco';
import { UiService } from '../../core/services/ui.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../ui/icon-base.component';
import { LanguageSwitcherComponent } from '../ui/language-switcher.component';

interface NavLinkItem {
  to: string;
  key: string;
  end: boolean;
}

const LINKS: NavLinkItem[] = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/modelos', key: 'nav.templates', end: false },
  { to: '/contato', key: 'nav.contact', end: false },
];

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoModule, IconComponent, LanguageSwitcherComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header
      [class]="
        'sticky top-0 z-40 border-b transition-colors ' +
        (scrolled() ? 'surface-header border-themed backdrop-blur' : 'border-transparent bg-transparent')
      "
      *transloco="let t"
    >
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a routerLink="/" class="flex min-w-0 items-center gap-2.5">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-md">
            <app-icon name="clipboard-list" [size]="18" />
          </span>
          <span class="truncate text-lg font-bold text-heading">{{ t('brand') }}</span>
        </a>

        <nav class="ml-6 hidden items-center gap-1 lg:flex">
          @for (l of links; track l.to) {
            <a
              [routerLink]="l.to"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: l.end }"
              [class]="linkClass(rla.isActive)"
            >
              {{ t(l.key) }}
            </a>
          }
        </nav>

        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            (click)="ui.toggleDarkMode()"
            [attr.aria-label]="t('common.theme')"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon [name]="ui.darkMode() ? 'sun' : 'moon'" [size]="18" />
          </button>
          <app-language-switcher />

          @if (auth.isAuthenticated()) {
            <a
              routerLink="/app"
              class="hidden h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex"
            >
              {{ t('nav.dashboard') }}
            </a>
          } @else {
            <a
              routerLink="/login"
              class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex"
            >
              {{ t('nav.login') }}
            </a>
            <a
              routerLink="/registro"
              class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex"
            >
              <app-icon name="plus" [size]="16" />
              {{ t('nav.createForm') }}
            </a>
          }

          <button
            type="button"
            (click)="mobileOpen.set(!mobileOpen())"
            class="flex h-10 w-10 items-center justify-center rounded-lg text-body lg:hidden"
            aria-label="Menu"
          >
            <app-icon [name]="mobileOpen() ? 'x' : 'menu'" [size]="22" />
          </button>
        </div>
      </div>

      @if (mobileOpen()) {
        <div class="surface-card border-t border-themed lg:hidden">
          <nav class="flex flex-col gap-1 px-4 py-4 sm:px-6">
            @for (l of links; track l.to) {
              <a
                [routerLink]="l.to"
                class="rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {{ t(l.key) }}
              </a>
            }
            <div class="mt-2 flex flex-col gap-2 border-t border-themed pt-3">
              @if (auth.isAuthenticated()) {
                <a
                  routerLink="/app"
                  class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white"
                >
                  {{ t('nav.dashboard') }}
                </a>
              } @else {
                <a
                  routerLink="/login"
                  class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body"
                >
                  {{ t('nav.login') }}
                </a>
                <a
                  routerLink="/registro"
                  class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white"
                >
                  {{ t('nav.createForm') }}
                </a>
              }
            </div>
          </nav>
        </div>
      }
    </header>
  `,
})
export class PublicNavbarComponent {
  ui = inject(UiService);
  auth = inject(AuthService);
  private router = inject(Router);

  protected links = LINKS;
  readonly mobileOpen = signal(false);
  readonly scrolled = signal(false);

  constructor() {
    this.scrolled.set(window.scrollY > 8);
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.mobileOpen.set(false));
  }

  linkClass(active: boolean) {
    return (
      'rounded-lg px-3 py-2 text-sm font-medium transition ' +
      (active ? 'text-brand-600 dark:text-brand-400' : 'text-body hover:text-heading')
    );
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 8);
  }
}

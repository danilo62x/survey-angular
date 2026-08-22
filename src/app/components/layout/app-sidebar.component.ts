import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { UiService } from '../../core/services/ui.service';
import { AuthService } from '../../core/services/auth.service';
import { SurveyService } from '../../core/services/survey.service';
import { IconComponent } from '../ui/icon-base.component';
import { usePlural } from '../../lib/i18n';

interface NavItem {
  to: string;
  labelKey: string;
  icon: string;
  end?: boolean;
}

const SECTIONS: { titleKey: string; items: NavItem[] }[] = [
  {
    titleKey: 'appNav.researchSection',
    items: [
      { to: '/app', labelKey: 'appNav.dashboard', icon: 'dashboard', end: true },
      { to: '/app/formularios', labelKey: 'appNav.forms', icon: 'clipboard-list' },
      { to: '/app/modelos', labelKey: 'appNav.templates', icon: 'layers' },
    ],
  },
  {
    titleKey: 'appNav.audienceSection',
    items: [{ to: '/app/contatos', labelKey: 'appNav.contacts', icon: 'users' }],
  },
  {
    titleKey: 'appNav.settingsSection',
    items: [{ to: '/app/configuracoes', labelKey: 'appNav.settings', icon: 'settings' }],
  },
];

@Component({
  selector: 'app-app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      [style.width]="width()"
      [class]="
        'surface-sidebar fixed top-0 left-0 z-50 flex h-screen flex-col overflow-y-hidden border-r px-4 transition-[transform,width] duration-300 lg:static lg:translate-x-0 ' +
        (ui.sidebarMobileOpen() ? 'translate-x-0' : '-translate-x-full')
      "
      *transloco="let t"
    >
      <div [class]="'flex items-center pt-7 pb-6 ' + (ui.sidebarCollapsed() ? 'justify-center' : 'justify-between')">
        <a routerLink="/app" class="flex min-w-0 items-center gap-2.5">
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white shadow-theme-sm"
          >
            <app-icon name="clipboard-list" [size]="18" />
          </span>
          @if (!ui.sidebarCollapsed()) {
            <span data-brand-text class="truncate text-lg font-semibold">{{ t('brand') }}</span>
          }
        </a>
        @if (!ui.sidebarCollapsed()) {
          <button
            type="button"
            class="is-sidebar-inactive hidden h-8 w-8 items-center justify-center rounded-lg border border-themed lg:flex"
            (click)="ui.toggleSidebar()"
            [title]="t('appNav.collapse')"
          >
            <app-icon name="chevron-right" [size]="14" class="rotate-180" />
          </button>
        }
      </div>

      <div class="no-scrollbar flex flex-col gap-5 overflow-y-auto pb-4">
        @for (section of sections; track section.titleKey) {
          <nav>
            @if (!ui.sidebarCollapsed()) {
              <h3 class="mb-2 px-2 text-[11px] font-semibold tracking-wider uppercase">{{ t(section.titleKey) }}</h3>
            }
            <ul class="flex flex-col gap-1">
              @for (item of section.items; track item.to) {
                <li>
                  <a
                    [routerLink]="item.to"
                    routerLinkActive
                    [routerLinkActiveOptions]="{ exact: !!item.end }"
                    #rla="routerLinkActive"
                    [class]="navLinkClass(rla.isActive)"
                    [title]="ui.sidebarCollapsed() ? t(item.labelKey) : null"
                    (click)="ui.toggleSidebarMobile(false)"
                  >
                    <app-icon [name]="item.icon" [size]="20" />
                    @if (!ui.sidebarCollapsed()) {
                      <span class="min-w-0 flex-1 truncate">{{ t(item.labelKey) }}</span>
                    }
                  </a>
                </li>
              }
            </ul>
          </nav>
        }
      </div>

      <div class="mt-auto space-y-3 border-t border-themed py-4">
        @if (!ui.sidebarCollapsed()) {
          <div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10">
            <p class="text-xs font-medium text-muted">{{ t('appNav.weekTitle') }}</p>
            <p class="mt-0.5 text-sm font-semibold text-heading">
              {{ t(pl('appNav.weekDesc', week()), { count: week() }) }}
            </p>
            <a
              routerLink="/app/formularios"
              class="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-brand-500 text-xs font-medium text-white transition hover:bg-brand-600"
            >
              {{ t('appNav.openForms') }}
            </a>
          </div>
        }
        <button
          type="button"
          [class]="navLinkClass(false)"
          [title]="ui.sidebarCollapsed() ? t('appNav.logout') : null"
          (click)="logout()"
        >
          <app-icon name="logout" [size]="20" />
          @if (!ui.sidebarCollapsed()) {
            <span>{{ t('appNav.logout') }}</span>
          }
        </button>
      </div>
    </aside>
  `,
})
export class AppSidebarComponent {
  ui = inject(UiService);
  private auth = inject(AuthService);
  private data = inject(SurveyService);
  private router = inject(Router);
  protected pl = usePlural();

  protected sections = SECTIONS;
  readonly width = computed(() => (this.ui.sidebarCollapsed() ? '90px' : '280px'));

  readonly week = computed(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.data.responses().filter((r) => new Date(r.at) >= weekAgo).length;
  });

  navLinkClass(active: boolean) {
    return (
      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ' +
      (this.ui.sidebarCollapsed() ? 'justify-center ' : '') +
      (active ? 'is-sidebar-active' : 'is-sidebar-inactive')
    );
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

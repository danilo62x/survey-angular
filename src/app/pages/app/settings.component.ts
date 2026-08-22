import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { SurveyService } from '../../core/services/survey.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { TabsComponent, type TabItem } from '../../components/ui/tabs.component';
import { SwitchToggleComponent } from '../../components/ui/switch-toggle.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { LANGUAGES } from '../../core/transloco-loader';

const LABEL = 'mb-1.5 block text-sm font-medium text-heading';
const CONTROL = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    TabsComponent,
    SwitchToggleComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-page-header [title]="t('settings.title')" [subtitle]="t('settings.subtitle')" [hasAction]="false" />

      <app-tabs [tabs]="tabs(t)" [value]="tab()" (onChange)="tab.set($event)">
        @switch (tab()) {
          @case (0) {
            <div class="surface-card max-w-2xl rounded-2xl border p-5 md:p-6">
              <h2 class="text-base font-semibold text-heading">{{ t('settings.profile.title') }}</h2>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label [class]="label" for="p-name">{{ t('settings.profile.name') }}</label>
                  <input id="p-name" [ngModel]="name()" (ngModelChange)="name.set($event)" [class]="control" />
                </div>
                <div>
                  <label [class]="label" for="p-email">{{ t('settings.profile.email') }}</label>
                  <input
                    id="p-email"
                    type="email"
                    [ngModel]="email()"
                    (ngModelChange)="email.set($event)"
                    [class]="control"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label [class]="label" for="p-role">{{ t('settings.profile.role') }}</label>
                  <input id="p-role" [ngModel]="role()" (ngModelChange)="role.set($event)" [class]="control" />
                </div>
              </div>
              <button
                type="button"
                (click)="saveProfile()"
                class="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <app-icon name="check" [size]="16" />
                {{ t('common.save') }}
              </button>
            </div>
          }

          @case (1) {
            <div class="surface-card max-w-2xl rounded-2xl border p-5 md:p-6">
              <h2 class="text-base font-semibold text-heading">{{ t('settings.org.title') }}</h2>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label [class]="label" for="o-name">{{ t('settings.org.name') }}</label>
                  <input id="o-name" [ngModel]="org()" (ngModelChange)="org.set($event)" [class]="control" />
                </div>
                <div>
                  <label [class]="label" for="o-domain">{{ t('settings.org.domain') }}</label>
                  <input id="o-domain" [ngModel]="domain()" (ngModelChange)="domain.set($event)" [class]="control" />
                </div>
              </div>
              <p class="mt-3 text-xs text-muted">{{ t('settings.org.domainHint') }}</p>
              <button
                type="button"
                (click)="saveOrg()"
                class="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <app-icon name="check" [size]="16" />
                {{ t('common.save') }}
              </button>
            </div>
          }

          @case (2) {
            <div class="surface-card max-w-2xl rounded-2xl border p-5 md:p-6">
              <h2 class="text-base font-semibold text-heading">{{ t('settings.notifications.title') }}</h2>
              <ul class="mt-5 flex flex-col gap-3">
                <li class="flex items-center justify-between gap-4 rounded-xl border border-themed px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.notifications.response') }}</p>
                    <p class="text-xs text-muted">{{ t('settings.notifications.responseDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="ui.notifyOnResponse()" (changed)="setNotifyOnResponse($event)" />
                </li>
                <li class="flex items-center justify-between gap-4 rounded-xl border border-themed px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.notifications.weekly') }}</p>
                    <p class="text-xs text-muted">{{ t('settings.notifications.weeklyDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="weekly()" (changed)="weekly.set($event)" />
                </li>
                <li class="flex items-center justify-between gap-4 rounded-xl border border-themed px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.notifications.closing') }}</p>
                    <p class="text-xs text-muted">{{ t('settings.notifications.closingDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="closing()" (changed)="closing.set($event)" />
                </li>
              </ul>
            </div>
          }

          @default {
            <div class="flex max-w-2xl flex-col gap-6">
              <div class="surface-card rounded-2xl border p-5 md:p-6">
                <h2 class="text-base font-semibold text-heading">{{ t('settings.tabs.appearance') }}</h2>
                <div class="mt-5 flex items-center justify-between gap-4 rounded-xl border border-themed px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-heading">{{ t('settings.appearance.dark') }}</p>
                    <p class="text-xs text-muted">{{ t('settings.appearance.darkDesc') }}</p>
                  </div>
                  <app-switch-toggle [checked]="ui.darkMode()" (changed)="ui.setDarkMode($event)" />
                </div>

                <div class="mt-5">
                  <label [class]="label" for="lang">{{ t('settings.appearance.language') }}</label>
                  <select
                    id="lang"
                    [ngModel]="activeLang()"
                    (ngModelChange)="changeLanguage($event)"
                    [class]="control"
                  >
                    @for (lang of languages; track lang.code) {
                      <option [value]="lang.code">{{ lang.flag }} {{ lang.label }}</option>
                    }
                  </select>
                  <p class="mt-1.5 text-xs text-muted">{{ t('settings.appearance.languageHint') }}</p>
                </div>
              </div>

              <div class="rounded-2xl border border-dashed border-themed p-5 md:p-6">
                <h2 class="text-base font-semibold text-heading">{{ t('settings.reset.title') }}</h2>
                <p class="mt-1 text-sm text-muted">{{ t('settings.reset.desc') }}</p>
                <button
                  type="button"
                  (click)="reset()"
                  class="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <app-icon name="refresh-cw" [size]="16" />
                  {{ t('settings.reset.action') }}
                </button>
              </div>
            </div>
          }
        }
      </app-tabs>
    </ng-container>
  `,
})
export class SettingsPageComponent {
  private auth = inject(AuthService);
  ui = inject(UiService);
  private data = inject(SurveyService);
  private transloco = inject(TranslocoService);

  protected label = LABEL;
  protected control = CONTROL;
  protected languages = LANGUAGES;

  readonly tab = signal(0);
  readonly name = signal(this.auth.user()?.name ?? '');
  readonly email = signal(this.auth.user()?.email ?? '');
  readonly role = signal(this.auth.user()?.role ?? '');
  readonly org = signal(this.auth.user()?.organization ?? 'Sondagem');
  readonly domain = signal('sondagem.com');
  readonly weekly = signal(true);
  readonly closing = signal(true);
  readonly activeLang = signal(this.transloco.getActiveLang());

  constructor() {
    usePageTitle('settings.title');
    this.transloco.langChanges$.subscribe((l) => this.activeLang.set(l));
  }

  tabs(t: (key: string) => string): TabItem[] {
    return [
      { label: t('settings.tabs.profile'), icon: 'user' },
      { label: t('settings.tabs.org'), icon: 'briefcase' },
      { label: t('settings.tabs.notifications'), icon: 'bell' },
      { label: t('settings.tabs.appearance'), icon: 'palette' },
    ];
  }

  saveProfile() {
    this.auth.updateProfile({ name: this.name(), email: this.email(), role: this.role() });
    this.ui.notifySuccess(this.transloco.translate('settings.profile.saved'));
  }

  saveOrg() {
    this.auth.updateProfile({ organization: this.org() });
    this.ui.notifySuccess(this.transloco.translate('settings.org.saved'));
  }

  setNotifyOnResponse(value: boolean) {
    this.ui.setNotifyOnResponse(value);
    this.ui.notifySuccess(this.transloco.translate('settings.saved'));
  }

  changeLanguage(code: string) {
    this.transloco.setActiveLang(code);
    try {
      localStorage.setItem('lang', code);
    } catch {}
  }

  reset() {
    this.data.reset();
    this.ui.notifySuccess(this.transloco.translate('settings.reset.done'));
  }
}

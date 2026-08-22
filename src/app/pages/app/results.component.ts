import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { setLiteralTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { UiService } from '../../core/services/ui.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { TabsComponent, type TabItem } from '../../components/ui/tabs.component';
import { AvatarComponent } from '../../components/ui/avatar.component';
import { BadgeComponent } from '../../components/ui/badge.component';
import { PaginationComponent } from '../../components/ui/pagination.component';
import { FilterBarComponent } from '../../components/ui/filter-bar.component';
import { KpiCardComponent } from '../../components/sv/kpi-card.component';
import { QuestionSummaryCardComponent } from '../../components/sv/question-summary-card.component';
import { ResponseDrawerComponent } from '../../components/sv/response-drawer.component';
import { SourceBadgeComponent } from '../../components/sv/status-pill.component';
import { formatDateTime } from '../../lib/format';
import { useLang, usePlural } from '../../lib/i18n';
import {
  answerToText,
  averageSeconds,
  buildCsv,
  completionRate,
  contactById,
  downloadCsv,
  formatSeconds,
  responsesOf,
  summarizeSurvey,
  surveyNps,
} from '../../core/data/query';
import type { Response, ResponseSource } from '../../core/data/types';
import type { Crumb } from '../../components/ui/breadcrumb.component';

const PAGE_SIZE = 10;
const SOURCES: ResponseSource[] = ['link', 'email', 'qr', 'incorporado'];

@Component({
  selector: 'app-results-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    IconComponent,
    EmptyStateComponent,
    TabsComponent,
    AvatarComponent,
    BadgeComponent,
    PaginationComponent,
    FilterBarComponent,
    KpiCardComponent,
    QuestionSummaryCardComponent,
    ResponseDrawerComponent,
    SourceBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (!survey()) {
        <app-empty-state
          icon="chart"
          [title]="t('builder.notFoundTitle')"
          [description]="t('builder.notFoundDesc')"
        >
          <a
            routerLink="/app/formularios"
            class="inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white"
          >
            {{ t('builder.backToForms') }}
          </a>
        </app-empty-state>
      } @else {
        <app-page-header [title]="t('results.title')" [subtitle]="survey()!.title" [crumbs]="crumbs(t)">
          <div class="flex flex-wrap items-center gap-2">
            <a
              [routerLink]="'/app/formularios/' + survey()!.id"
              class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <app-icon name="edit" [size]="16" />
              {{ t('forms.edit') }}
            </a>
            <button
              type="button"
              (click)="exportCsv()"
              [disabled]="filtered().length === 0"
              class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              <app-icon name="download" [size]="16" />
              {{ t('results.export') }}
            </button>
          </div>
        </app-page-header>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-kpi-card
            [title]="t('results.kpi.total')"
            [value]="responses().length"
            icon="inbox"
            accent="brand"
            [hint]="t('results.kpi.totalHint', { views: survey()!.views })"
          />
          <app-kpi-card
            [title]="t('results.kpi.completion')"
            [value]="completionLabel()"
            icon="check-circle"
            accent="success"
            [hint]="t(pl('results.kpi.completionHint', completedCount()), { count: completedCount() })"
          />
          <app-kpi-card
            [title]="t('results.kpi.time')"
            [value]="avgLabel()"
            icon="clock"
            accent="warning"
            [hint]="t('results.kpi.timeHint')"
          />
          <app-kpi-card
            [title]="t('results.kpi.nps')"
            [value]="nps() ? nps()!.score : '—'"
            icon="gauge"
            accent="info"
            [hint]="npsHint(t)"
          />
        </div>

        <div class="mt-6">
          <app-tabs [tabs]="tabs(t)" [value]="tab()" (onChange)="tab.set($event)">
            @if (tab() === 0) {
              <!-- Resumo -->
              @if (responses().length === 0) {
                <div class="surface-card rounded-2xl border">
                  <app-empty-state
                    icon="inbox"
                    [title]="t('results.emptyTitle')"
                    [description]="t('results.emptyDesc')"
                  />
                </div>
              } @else {
                <div class="flex flex-col gap-5">
                  @for (summary of summaries(); track summary.question.id; let index = $index) {
                    <app-question-summary-card
                      [summary]="summary"
                      [index]="index"
                      [color]="survey()!.color"
                    />
                  }
                </div>
              }
            } @else {
              <!-- Individuais -->
              <div>
                <app-filter-bar
                  [search]="term()"
                  (searchChange)="term.set($event)"
                  [searchPlaceholder]="t('results.searchPlaceholder')"
                >
                  <label class="flex items-center gap-2 text-sm text-muted">
                    <span class="whitespace-nowrap">{{ t('results.source') }}</span>
                    <select
                      [ngModel]="source()"
                      (ngModelChange)="setSource($event)"
                      class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
                    >
                      <option value="all">{{ t('common.all') }}</option>
                      @for (s of sources; track s) {
                        <option [value]="s">{{ t('sources.' + s) }}</option>
                      }
                    </select>
                  </label>
                  <label class="flex items-center gap-2 text-sm text-muted">
                    <span class="whitespace-nowrap">{{ t('results.status') }}</span>
                    <select
                      [ngModel]="onlyCompleted()"
                      (ngModelChange)="setCompleted($event)"
                      class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
                    >
                      <option value="all">{{ t('common.all') }}</option>
                      <option value="yes">{{ t('results.completed') }}</option>
                      <option value="no">{{ t('results.partial') }}</option>
                    </select>
                  </label>
                </app-filter-bar>

                @if (filtered().length === 0) {
                  <div class="surface-card rounded-2xl border">
                    <app-empty-state
                      icon="inbox"
                      [title]="t('results.emptyFilterTitle')"
                      [description]="t('results.emptyFilterDesc')"
                    >
                      <button
                        type="button"
                        (click)="clearFilters()"
                        class="inline-flex h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body"
                      >
                        {{ t('common.clearFilters') }}
                      </button>
                    </app-empty-state>
                  </div>
                } @else {
                  <div class="surface-card overflow-hidden rounded-2xl border">
                    <div class="overflow-x-auto">
                      <table class="w-full min-w-[48rem] text-left text-sm">
                        <thead>
                          <tr class="border-b border-themed">
                            <th class="px-5 py-3 font-medium text-muted">#</th>
                            <th class="px-5 py-3 font-medium text-muted">{{ t('results.respondent') }}</th>
                            <th class="px-5 py-3 font-medium text-muted">{{ t('results.date') }}</th>
                            <th class="px-5 py-3 font-medium text-muted">{{ t('results.source') }}</th>
                            <th class="px-5 py-3 text-right font-medium text-muted">{{ t('results.duration') }}</th>
                            <th class="px-5 py-3 font-medium text-muted">{{ t('results.status') }}</th>
                            <th class="px-5 py-3 text-right font-medium text-muted">{{ t('common.actions') }}</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (response of pageRows(); track response.id) {
                            <tr class="border-b border-themed last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                              <td class="px-5 py-3 tabular-nums text-muted">{{ response.id }}</td>
                              <td class="max-w-[16rem] px-5 py-3">
                                <div class="flex min-w-0 items-center gap-2.5">
                                  @if (contactOf(response); as contact) {
                                    <app-avatar [src]="contact.avatar" [name]="contact.name" size="xs" />
                                    <span class="min-w-0">
                                      <span class="block truncate text-sm text-heading">{{ contact.name }}</span>
                                      <span class="block truncate text-xs text-muted">{{ contact.email }}</span>
                                    </span>
                                  } @else {
                                    <span class="text-muted">{{ t('results.anonymous') }}</span>
                                  }
                                </div>
                              </td>
                              <td class="px-5 py-3 text-muted">{{ when(response) }}</td>
                              <td class="px-5 py-3"><app-source-badge [source]="response.source" /></td>
                              <td class="px-5 py-3 text-right tabular-nums text-body">
                                {{ duration(response.durationSec) }}
                              </td>
                              <td class="px-5 py-3">
                                <app-badge [color]="response.completed ? 'success' : 'warning'" [dot]="true">
                                  {{ t(response.completed ? 'results.completed' : 'results.partial') }}
                                </app-badge>
                              </td>
                              <td class="px-5 py-3 text-right">
                                <button
                                  type="button"
                                  (click)="selected.set(response)"
                                  class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                  <app-icon name="eye" [size]="14" />
                                  {{ t('results.view') }}
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="mt-5">
                    <app-pagination [page]="page()" [totalPages]="totalPages()" (onChange)="page.set($event)" />
                  </div>
                }
              </div>
            }
          </app-tabs>
        </div>

        <app-response-drawer
          [open]="selected() !== null"
          (closed)="selected.set(null)"
          [survey]="survey()"
          [response]="selected()"
          [contacts]="data.contacts()"
        />
      }
    </ng-container>
  `,
})
export class ResultsPageComponent {
  data = inject(SurveyService);
  private ui = inject(UiService);
  private route = inject(ActivatedRoute);
  private transloco = inject(TranslocoService);
  private lang = useLang();
  protected pl = usePlural();

  protected sources = SOURCES;

  private id = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id') ?? 0))), { initialValue: 0 });
  // selectTranslate espera o JSON carregar — translate() puro devolveria a chave crua no título.
  private resultsTitle = toSignal(this.transloco.selectTranslate<string>('results.title'), { initialValue: '' });

  readonly tab = signal(0);
  readonly page = signal(1);
  readonly source = signal<'all' | ResponseSource>('all');
  readonly onlyCompleted = signal<'all' | 'yes' | 'no'>('all');
  readonly term = signal('');
  readonly selected = signal<Response | null>(null);

  readonly survey = computed(() => this.data.surveys().find((s) => s.id === this.id()));
  readonly responses = computed(() => {
    const s = this.survey();
    return s ? responsesOf(this.data.responses(), s.id) : [];
  });
  readonly summaries = computed(() => {
    const s = this.survey();
    return s ? summarizeSurvey(s, this.responses()) : [];
  });
  readonly nps = computed(() => {
    const s = this.survey();
    return s ? surveyNps(s, this.responses()) : null;
  });
  readonly completedCount = computed(() => this.responses().filter((r) => r.completed).length);

  readonly filtered = computed(() => {
    const needle = this.term().trim().toLowerCase();
    const source = this.source();
    const onlyCompleted = this.onlyCompleted();
    const contacts = this.data.contacts();
    return this.responses()
      .filter((r) => (source === 'all' ? true : r.source === source))
      .filter((r) => (onlyCompleted === 'all' ? true : onlyCompleted === 'yes' ? r.completed : !r.completed))
      .filter((r) => {
        if (!needle) return true;
        const contact = contactById(contacts, r.contactId);
        const haystack = [contact?.name ?? '', contact?.email ?? '', ...r.answers.map((a) => answerToText(a.value))]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageRows = computed(() =>
    this.filtered().slice((this.page() - 1) * PAGE_SIZE, this.page() * PAGE_SIZE)
  );

  constructor() {
    effect(() => {
      const survey = this.survey();
      const title = this.resultsTitle();
      if (!title) return;
      setLiteralTitle(survey ? `${survey.title} — ${title}` : title);
    });
  }

  crumbs(t: (key: string) => string): Crumb[] {
    const survey = this.survey();
    return [
      { label: t('appNav.forms'), href: '/app/formularios', icon: 'clipboard-list' },
      { label: survey?.title ?? '', href: `/app/formularios/${survey?.id ?? ''}` },
      { label: t('results.title') },
    ];
  }

  tabs(t: (key: string) => string): TabItem[] {
    return [
      { label: t('results.tabs.summary'), icon: 'pie-chart' },
      { label: t('results.tabs.individual'), icon: 'list' },
    ];
  }

  completionLabel() {
    return `${Math.round(completionRate(this.responses()) * 100)}%`;
  }

  avgLabel() {
    return this.responses().length ? formatSeconds(averageSeconds(this.responses())) : '—';
  }

  npsHint(t: (key: string, params?: Record<string, unknown>) => string) {
    const nps = this.nps();
    return nps ? t(this.pl('results.kpi.npsHint', nps.total), { count: nps.total }) : t('results.kpi.npsNone');
  }

  contactOf(response: Response) {
    return contactById(this.data.contacts(), response.contactId);
  }

  when(response: Response) {
    return formatDateTime(response.at, this.lang());
  }

  duration(seconds: number) {
    return formatSeconds(seconds);
  }

  setSource(value: 'all' | ResponseSource) {
    this.source.set(value);
    this.page.set(1);
  }

  setCompleted(value: 'all' | 'yes' | 'no') {
    this.onlyCompleted.set(value);
    this.page.set(1);
  }

  clearFilters() {
    this.term.set('');
    this.source.set('all');
    this.onlyCompleted.set('all');
  }

  exportCsv() {
    const survey = this.survey();
    if (!survey) return;
    const csv = buildCsv(
      survey,
      this.filtered(),
      this.data.contacts(),
      {
        id: this.transloco.translate('results.csv.id'),
        at: this.transloco.translate('results.csv.at'),
        duration: this.transloco.translate('results.csv.duration'),
        completed: this.transloco.translate('results.csv.completed'),
        source: this.transloco.translate('results.csv.source'),
        contact: this.transloco.translate('results.csv.contact'),
      },
      this.transloco.translate('common.yes'),
      this.transloco.translate('common.no')
    );
    downloadCsv(`${survey.slug}-respostas.csv`, csv);
    const count = this.filtered().length;
    this.ui.notifySuccess(this.transloco.translate(this.pl('results.exported', count), { count }));
  }
}

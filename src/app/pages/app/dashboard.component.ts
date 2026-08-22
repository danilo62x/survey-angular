import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { KpiCardComponent } from '../../components/sv/kpi-card.component';
import { SourceBadgeComponent, SurveyStatusComponent } from '../../components/sv/status-pill.component';
import { ApexChartComponent } from '../../components/ui/apex-chart.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useLang, usePlural } from '../../lib/i18n';
import {
  averageSeconds,
  completionRate,
  contactById,
  formatSeconds,
  latestResponses,
  npsFrom,
  ordered,
  responsesPerDay,
  responsesThisMonth,
  sourceBreakdown,
  surveyById,
  topSurveys,
} from '../../core/data/query';
import type { Response } from '../../core/data/types';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    KpiCardComponent,
    SourceBadgeComponent,
    SurveyStatusComponent,
    ApexChartComponent,
    IconComponent,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-page-header [title]="t('dashboard.title')" [subtitle]="t('dashboard.subtitle')">
        <a
          routerLink="/app/formularios"
          [queryParams]="{ novo: '1' }"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <app-icon name="plus" [size]="16" />
          {{ t('forms.new') }}
        </a>
      </app-page-header>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <app-kpi-card
          [title]="t('dashboard.kpi.month')"
          [value]="monthLabel()"
          icon="inbox"
          accent="brand"
          [hint]="t('dashboard.kpi.monthHint', { total: data.responses().length })"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.completion')"
          [value]="completionLabel()"
          icon="check-circle"
          accent="success"
          [hint]="t('dashboard.kpi.completionHint')"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.time')"
          [value]="avgLabel()"
          icon="clock"
          accent="warning"
          [hint]="t('dashboard.kpi.timeHint')"
        />
        <app-kpi-card
          [title]="t('dashboard.kpi.nps')"
          [value]="nps().total ? nps().score : '—'"
          icon="gauge"
          accent="info"
          [hint]="t(pl('dashboard.kpi.npsHint', nps().total), { count: nps().total })"
        />
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-3">
        <div class="surface-card min-w-0 rounded-2xl border p-5 shadow-theme-sm md:p-6 xl:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-heading">{{ t('dashboard.charts.perDay') }}</h2>
            <span class="text-xs text-muted">{{ t('dashboard.charts.lastDays', { count: 30 }) }}</span>
          </div>
          <div class="mt-4">
            <app-apex-chart
              type="area"
              [height]="300"
              [series]="[{ name: t('dashboard.charts.responsesSeries'), data: seriesData() }]"
              [options]="chartOptions()"
            />
          </div>
        </div>

        <div class="surface-card min-w-0 rounded-2xl border p-5 shadow-theme-sm md:p-6">
          <h2 class="text-base font-semibold text-heading">{{ t('dashboard.sources') }}</h2>
          <p class="mt-1 text-xs text-muted">{{ t('dashboard.sourcesHint') }}</p>
          <ul class="mt-5 flex flex-col gap-4">
            @for (slice of sources(); track slice.label) {
              <li class="min-w-0">
                <div class="flex items-center justify-between gap-3 text-sm">
                  <span class="min-w-0 truncate text-body">{{ t('sources.' + slice.label) }}</span>
                  <span class="shrink-0 tabular-nums text-muted">{{ slice.percent }}%</span>
                </div>
                <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div class="h-full rounded-full bg-brand-500" [style.width.%]="slice.percent"></div>
                </div>
              </li>
            }
          </ul>
        </div>
      </div>

      <div class="mt-6 grid gap-6 xl:grid-cols-2">
        <div class="surface-card min-w-0 rounded-2xl border p-5 shadow-theme-sm md:p-6">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-heading">{{ t('dashboard.topForms') }}</h2>
            <a routerLink="/app/formularios" class="text-sm font-medium text-brand-600 dark:text-brand-400">
              {{ t('common.viewAll') }}
            </a>
          </div>
          @if (top().length === 0) {
            <app-empty-state
              icon="clipboard-list"
              [title]="t('dashboard.emptyTitle')"
              [description]="t('dashboard.emptyDesc')"
            />
          } @else {
            <ul class="mt-5 flex flex-col gap-4">
              @for (row of top(); track row.survey.id) {
                <li class="flex min-w-0 items-center gap-3">
                  <div class="min-w-0 flex-1">
                    <a
                      [routerLink]="'/app/formularios/' + row.survey.id + '/respostas'"
                      class="block truncate text-sm font-medium text-heading hover:text-brand-600"
                    >
                      {{ row.survey.title }}
                    </a>
                    <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        class="h-full rounded-full"
                        [style.width.%]="(row.responses / topMax()) * 100"
                        [style.backgroundColor]="row.survey.color"
                      ></div>
                    </div>
                  </div>
                  <span class="shrink-0 text-sm font-semibold tabular-nums text-heading">{{ row.responses }}</span>
                </li>
              }
            </ul>
          }
        </div>

        <div class="surface-card min-w-0 rounded-2xl border p-5 shadow-theme-sm md:p-6">
          <h2 class="text-base font-semibold text-heading">{{ t('dashboard.latest') }}</h2>
          @if (latest().length === 0) {
            <app-empty-state icon="inbox" [title]="t('dashboard.emptyTitle')" [description]="t('dashboard.emptyDesc')" />
          } @else {
            <ul class="mt-5 flex flex-col gap-4">
              @for (response of latest(); track response.id) {
                <li class="flex min-w-0 items-start gap-3">
                  <span
                    class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-muted dark:bg-gray-800"
                  >
                    <app-icon name="inbox" [size]="15" />
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-heading">{{ surveyTitle(response) }}</p>
                    <p class="truncate text-xs text-muted">
                      {{ contactName(response) || t('results.anonymous') }} · {{ when(response) }}
                    </p>
                  </div>
                  <div class="hidden shrink-0 sm:block">
                    <app-source-badge [source]="response.source" />
                  </div>
                </li>
              }
            </ul>
          }
        </div>
      </div>

      <div class="surface-card mt-6 min-w-0 rounded-2xl border p-5 shadow-theme-sm md:p-6">
        <h2 class="text-base font-semibold text-heading">{{ t('dashboard.statusTitle') }}</h2>
        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          @for (survey of data.surveys(); track survey.id) {
            <a
              [routerLink]="'/app/formularios/' + survey.id"
              class="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-themed px-4 py-3 transition hover:border-brand-300"
            >
              <span class="min-w-0 truncate text-sm font-medium text-body">{{ survey.title }}</span>
              <span class="shrink-0">
                <app-survey-status [status]="survey.status" />
              </span>
            </a>
          }
        </div>
      </div>
    </ng-container>
  `,
})
export class DashboardPageComponent {
  data = inject(SurveyService);
  private lang = useLang();
  protected pl = usePlural();

  constructor() {
    usePageTitle('appNav.dashboard');
  }

  readonly month = computed(() => responsesThisMonth(this.data.responses()));
  readonly rate = computed(() => completionRate(this.data.responses()));
  readonly avg = computed(() => averageSeconds(this.data.responses()));

  readonly nps = computed(() => {
    const values: number[] = [];
    for (const survey of this.data.surveys()) {
      const question = ordered(survey.questions).find((q) => q.type === 'nps');
      if (!question) continue;
      for (const response of this.data.responses()) {
        if (response.surveyId !== survey.id) continue;
        const answer = response.answers.find((a) => a.questionId === question.id);
        if (typeof answer?.value === 'number') values.push(answer.value);
      }
    }
    return npsFrom(values);
  });

  readonly series = computed(() => responsesPerDay(this.data.responses(), 30));
  readonly seriesData = computed(() => this.series().map((p) => p.value));
  readonly top = computed(() => topSurveys(this.data.surveys(), this.data.responses(), 5));
  readonly topMax = computed(() => Math.max(1, this.top()[0]?.responses ?? 0));
  readonly latest = computed(() => latestResponses(this.data.responses(), 6));
  readonly sources = computed(() => sourceBreakdown(this.data.responses()));

  readonly chartOptions = computed(() => ({
    xaxis: { categories: this.series().map((p) => this.dayLabel(p.label)), tickAmount: 8 },
    yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0.05 } },
  }));

  monthLabel() {
    return formatNumber(this.month(), this.lang());
  }
  completionLabel() {
    return `${Math.round(this.rate() * 100)}%`;
  }
  avgLabel() {
    return formatSeconds(this.avg());
  }

  private dayLabel(iso: string) {
    const d = new Date(`${iso}T12:00:00`);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  surveyTitle(response: Response) {
    return surveyById(this.data.surveys(), response.surveyId)?.title ?? '—';
  }

  contactName(response: Response) {
    return contactById(this.data.contacts(), response.contactId)?.name ?? '';
  }

  when(response: Response) {
    return formatDateTime(response.at, this.lang());
  }
}

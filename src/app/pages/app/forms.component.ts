import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { UiService } from '../../core/services/ui.service';
import { PageHeaderComponent } from '../../components/app/page-header.component';
import { FilterBarComponent } from '../../components/ui/filter-bar.component';
import { EmptyStateComponent } from '../../components/ui/empty-state.component';
import { ModalComponent } from '../../components/ui/modal.component';
import { IconComponent } from '../../components/ui/icon-base.component';
import { SurveyStatusComponent } from '../../components/sv/status-pill.component';
import { SurveyCardComponent } from '../../components/sv/survey-card.component';
import { formatDate } from '../../lib/format';
import { useLang } from '../../lib/i18n';
import { formatSeconds, surveyStats } from '../../core/data/query';
import type { FormStatus, SurveyStats } from '../../core/data/types';

const STATUSES: FormStatus[] = ['rascunho', 'publicado', 'encerrado'];

const ICON_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-heading';

@Component({
  selector: 'app-forms-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoModule,
    PageHeaderComponent,
    FilterBarComponent,
    EmptyStateComponent,
    ModalComponent,
    IconComponent,
    SurveyStatusComponent,
    SurveyCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <app-page-header [title]="t('forms.title')" [subtitle]="t('forms.subtitle')">
        <button
          type="button"
          (click)="creating.set(true)"
          class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          <app-icon name="plus" [size]="16" />
          {{ t('forms.new') }}
        </button>
      </app-page-header>

      <app-filter-bar
        [search]="term()"
        (searchChange)="term.set($event)"
        [searchPlaceholder]="t('forms.searchPlaceholder')"
      >
        <label class="flex items-center gap-2 text-sm text-muted">
          {{ t('common.status') }}
          <select
            [ngModel]="status()"
            (ngModelChange)="status.set($event)"
            class="focus-ring rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body"
          >
            <option value="all">{{ t('common.all') }}</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ t('statuses.' + s) }}</option>
            }
          </select>
        </label>

        <div filterAction class="flex items-center gap-1 rounded-lg border border-themed p-1">
          @for (mode of viewModes; track mode) {
            <button
              type="button"
              (click)="view.set(mode)"
              [attr.aria-label]="t(mode === 'table' ? 'forms.viewTable' : 'forms.viewCards')"
              [title]="t(mode === 'table' ? 'forms.viewTable' : 'forms.viewCards')"
              [class]="
                'flex h-8 w-8 items-center justify-center rounded-md transition ' +
                (view() === mode ? 'bg-brand-500 text-white' : 'text-muted hover:text-heading')
              "
            >
              <app-icon [name]="mode === 'table' ? 'list' : 'grid'" [size]="16" />
            </button>
          }
        </div>
      </app-filter-bar>

      @if (filtered().length === 0) {
        <div class="surface-card rounded-2xl border">
          <app-empty-state
            icon="clipboard-list"
            [title]="t('forms.emptyTitle')"
            [description]="t('forms.emptyDesc')"
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
      } @else if (view() === 'cards') {
        <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          @for (row of filtered(); track row.survey.id) {
            <app-survey-card [stats]="row" />
          }
        </div>
      } @else {
        <div class="surface-card overflow-hidden rounded-2xl border">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr class="border-b border-themed">
                  <th class="px-5 py-3 font-medium text-muted">{{ t('forms.form') }}</th>
                  <th class="px-5 py-3 font-medium text-muted">{{ t('common.status') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('forms.responses') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('forms.completion') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('forms.avgTime') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('forms.nps') }}</th>
                  <th class="px-5 py-3 font-medium text-muted">{{ t('forms.lastResponse') }}</th>
                  <th class="px-5 py-3 text-right font-medium text-muted">{{ t('common.actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (row of filtered(); track row.survey.id) {
                  <tr class="border-b border-themed last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td class="max-w-xs px-5 py-3">
                      <a
                        [routerLink]="'/app/formularios/' + row.survey.id"
                        class="block truncate font-medium text-heading hover:text-brand-600"
                      >
                        {{ row.survey.title }}
                      </a>
                      <span class="block truncate text-xs text-muted">/f/{{ row.survey.slug }}</span>
                    </td>
                    <td class="px-5 py-3"><app-survey-status [status]="row.survey.status" /></td>
                    <td class="px-5 py-3 text-right tabular-nums text-body">{{ row.responses }}</td>
                    <td class="px-5 py-3 text-right tabular-nums text-body">{{ percent(row.completionRate) }}%</td>
                    <td class="px-5 py-3 text-right tabular-nums text-body">
                      {{ row.responses ? seconds(row.averageSeconds) : '—' }}
                    </td>
                    <td class="px-5 py-3 text-right tabular-nums text-body">
                      {{ row.nps === null ? '—' : row.nps }}
                    </td>
                    <td class="px-5 py-3 text-muted">{{ row.lastAt ? date(row.lastAt) : '—' }}</td>
                    <td class="px-5 py-3">
                      <div class="flex items-center justify-end gap-1.5">
                        <a
                          [routerLink]="'/app/formularios/' + row.survey.id + '/respostas'"
                          [class]="iconButton"
                          [title]="t('forms.results')"
                          [attr.aria-label]="t('forms.results')"
                        >
                          <app-icon name="chart" [size]="15" />
                        </a>
                        <button
                          type="button"
                          (click)="copyLink(row.survey.slug)"
                          [class]="iconButton"
                          [title]="t('forms.copyLink')"
                          [attr.aria-label]="t('forms.copyLink')"
                        >
                          <app-icon name="link" [size]="15" />
                        </button>
                        <button
                          type="button"
                          (click)="duplicate(row.survey.id)"
                          [class]="iconButton"
                          [title]="t('forms.duplicate')"
                          [attr.aria-label]="t('forms.duplicate')"
                        >
                          <app-icon name="copy" [size]="15" />
                        </button>
                        @if (row.survey.status === 'publicado') {
                          <button
                            type="button"
                            (click)="close(row.survey.id)"
                            [class]="iconButton"
                            [title]="t('forms.close')"
                            [attr.aria-label]="t('forms.close')"
                          >
                            <app-icon name="lock" [size]="15" />
                          </button>
                        } @else {
                          <button
                            type="button"
                            (click)="publish(row.survey.id)"
                            [class]="iconButton"
                            [title]="t('forms.publish')"
                            [attr.aria-label]="t('forms.publish')"
                          >
                            <app-icon name="rocket" [size]="15" />
                          </button>
                        }
                        <button
                          type="button"
                          (click)="removing.set(row.survey.id)"
                          [class]="iconButton + ' hover:text-error-500'"
                          [title]="t('common.remove')"
                          [attr.aria-label]="t('common.remove')"
                        >
                          <app-icon name="trash" [size]="15" />
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Novo formulário -->
      <app-modal
        [open]="creating()"
        (closed)="creating.set(false)"
        [title]="t('forms.newTitle')"
        [subtitle]="t('forms.newSubtitle')"
        [hasFooter]="true"
      >
        <div class="flex flex-col gap-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-heading" for="new-title">
              {{ t('forms.formTitle') }}
            </label>
            <input
              id="new-title"
              [ngModel]="title()"
              (ngModelChange)="title.set($event)"
              [placeholder]="t('forms.formTitlePlaceholder')"
              class="focus-ring w-full rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-heading" for="new-template">
              {{ t('forms.startFrom') }}
            </label>
            <select
              id="new-template"
              [ngModel]="templateId()"
              (ngModelChange)="templateId.set($event)"
              class="focus-ring w-full rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
            >
              <option value="">{{ t('forms.blank') }}</option>
              @for (template of data.templates(); track template.id) {
                <option [value]="template.id">{{ template.name }}</option>
              }
            </select>
            <p class="mt-1.5 text-xs text-muted">{{ t('forms.startFromHint') }}</p>
          </div>
        </div>
        <ng-container modalFooter>
          <button
            type="button"
            (click)="creating.set(false)"
            class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="create()"
            [disabled]="!title().trim() && !templateId()"
            class="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {{ t('common.create') }}
          </button>
        </ng-container>
      </app-modal>

      <!-- Confirmar exclusão -->
      <app-modal
        [open]="removing() !== null"
        (closed)="removing.set(null)"
        [title]="t('forms.removeTitle')"
        size="sm"
        [hasFooter]="true"
      >
        <p class="text-sm text-muted">{{ t('forms.removeDesc') }}</p>
        <ng-container modalFooter>
          <button
            type="button"
            (click)="removing.set(null)"
            class="h-10 rounded-lg border border-themed px-4 text-sm font-medium text-body"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            (click)="confirmRemove()"
            class="h-10 rounded-lg bg-error-500 px-4 text-sm font-medium text-white transition hover:bg-error-600"
          >
            {{ t('common.remove') }}
          </button>
        </ng-container>
      </app-modal>
    </ng-container>
  `,
})
export class FormsPageComponent {
  data = inject(SurveyService);
  private ui = inject(UiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private transloco = inject(TranslocoService);
  private lang = useLang();

  protected statuses = STATUSES;
  protected viewModes: ('table' | 'cards')[] = ['table', 'cards'];
  protected iconButton = ICON_BUTTON;

  readonly term = signal('');
  readonly status = signal<'all' | FormStatus>('all');
  readonly view = signal<'table' | 'cards'>('table');
  readonly creating = signal(false);
  readonly removing = signal<number | null>(null);
  readonly title = signal('');
  readonly templateId = signal('');

  constructor() {
    usePageTitle('forms.title');
    if (this.route.snapshot.queryParamMap.get('novo') === '1') {
      this.creating.set(true);
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  readonly stats = computed(() => surveyStats(this.data.surveys(), this.data.responses()));

  readonly filtered = computed<SurveyStats[]>(() => {
    const needle = this.term().trim().toLowerCase();
    const status = this.status();
    return this.stats().filter((row) => {
      const matchesTerm = `${row.survey.title} ${row.survey.description}`.toLowerCase().includes(needle);
      const matchesStatus = status === 'all' || row.survey.status === status;
      return matchesTerm && matchesStatus;
    });
  });

  percent(rate: number) {
    return Math.round(rate * 100);
  }
  seconds(value: number) {
    return formatSeconds(value);
  }
  date(iso: string) {
    return formatDate(iso, this.lang());
  }

  clearFilters() {
    this.term.set('');
    this.status.set('all');
  }

  async copyLink(slug: string) {
    const link = `${window.location.origin}/f/${slug}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Sem permissão de área de transferência — o aviso ainda confirma a ação.
    }
    this.ui.notifySuccess(this.transloco.translate('forms.linkCopied'));
  }

  duplicate(id: number) {
    this.data.duplicateSurvey(id);
    this.ui.notifySuccess(this.transloco.translate('forms.duplicated'));
  }

  publish(id: number) {
    this.data.publishSurvey(id);
    this.ui.notifySuccess(this.transloco.translate('forms.published'));
  }

  close(id: number) {
    this.data.closeSurvey(id);
    this.ui.notifySuccess(this.transloco.translate('forms.closed'));
  }

  confirmRemove() {
    const id = this.removing();
    if (id !== null) this.data.removeSurvey(id);
    this.removing.set(null);
    this.ui.notifySuccess(this.transloco.translate('forms.removed'));
  }

  create() {
    const name = this.title().trim();
    const templateId = this.templateId();
    if (!name && !templateId) return;
    const created = templateId
      ? this.data.createFromTemplate(Number(templateId), name)
      : this.data.addSurvey(name, this.transloco.translate('forms.newDescription'));
    this.creating.set(false);
    this.title.set('');
    this.templateId.set('');
    if (created) {
      this.ui.notifySuccess(this.transloco.translate('forms.created'));
      this.router.navigateByUrl(`/app/formularios/${created.id}`);
    }
  }
}

import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { SurveyStatusComponent } from '../../components/sv/status-pill.component';
import { QuestionListComponent } from '../../components/sv/question-list.component';
import { QuestionEditorComponent } from '../../components/sv/question-editor.component';
import { LogicRuleRowComponent } from '../../components/sv/logic-rule-row.component';
import { QuestionRendererComponent } from '../../components/sv/question-renderer.component';
import { ProgressBarComponent } from '../../components/sv/progress-bar.component';
import { ShareBoxComponent } from '../../components/sv/share-box.component';
import { conditionalIds, ordered } from '../../core/data/query';
import { svImage } from '../../core/data/mock';
import { QUESTION_COLOR, QUESTION_ICON, QUESTION_TYPES } from '../../lib/question-types';
import { usePlural } from '../../lib/i18n';
import type { AnswerValue, LogicAction, LogicRule, Question, QuestionType } from '../../core/data/types';
import type { Crumb } from '../../components/ui/breadcrumb.component';

const COLORS = ['#465fff', '#12b76a', '#f79009', '#f04438', '#0ba5ec', '#7592ff', '#2a31d8', '#039855'];
const COVERS = ['atendimento', 'mercado', 'evento', 'time', 'conceito', 'workshop'];
const ACTIONS: LogicAction[] = ['pular-para', 'mostrar', 'esconder'];

@Component({
  selector: 'app-builder-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslocoModule,
    PageHeaderComponent,
    IconComponent,
    EmptyStateComponent,
    TabsComponent,
    SurveyStatusComponent,
    QuestionListComponent,
    QuestionEditorComponent,
    LogicRuleRowComponent,
    QuestionRendererComponent,
    ProgressBarComponent,
    ShareBoxComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (!survey()) {
        <app-empty-state
          icon="clipboard-list"
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
        <app-page-header [title]="survey()!.title" [subtitle]="t('builder.subtitle')" [crumbs]="crumbs(t)">
          <div class="flex flex-wrap items-center gap-2">
            <app-survey-status [status]="survey()!.status" />
            <a
              [routerLink]="'/f/' + survey()!.slug"
              class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <app-icon name="eye" [size]="16" />
              {{ t('builder.openPublic') }}
            </a>
            <a
              [routerLink]="'/app/formularios/' + survey()!.id + '/respostas'"
              class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <app-icon name="chart" [size]="16" />
              {{ t('forms.results') }}
            </a>
            @if (survey()!.status === 'publicado') {
              <button
                type="button"
                (click)="closeSurvey()"
                class="inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <app-icon name="lock" [size]="16" />
                {{ t('forms.close') }}
              </button>
            } @else {
              <button
                type="button"
                (click)="publishSurvey()"
                class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                <app-icon name="rocket" [size]="16" />
                {{ t('forms.publish') }}
              </button>
            }
          </div>
        </app-page-header>

        <p class="mb-5 flex items-center gap-2 text-xs text-muted">
          <app-icon name="check-circle" [size]="14" class="text-success-500" />
          {{ t('builder.autosave') }}
        </p>

        <app-tabs [tabs]="tabs(t)" [value]="tab()" (onChange)="tab.set($event)">
          @switch (tab()) {
            @case (0) {
              <!-- Perguntas -->
              <div class="grid gap-6 xl:grid-cols-12">
                <div class="min-w-0 xl:col-span-5">
                  <div class="flex items-center justify-between gap-3">
                    <h2 class="text-base font-semibold text-heading">
                      {{ t(pl('builder.questionsCount', questions().length), { count: questions().length }) }}
                    </h2>
                    <button
                      type="button"
                      (click)="adding.set(!adding())"
                      class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-xs font-medium text-white transition hover:bg-brand-600"
                    >
                      <app-icon [name]="adding() ? 'x' : 'plus'" [size]="14" />
                      {{ t(adding() ? 'common.close' : 'builder.addQuestion') }}
                    </button>
                  </div>

                  @if (adding()) {
                    <div class="surface-card mt-4 grid gap-2 rounded-2xl border p-4 sm:grid-cols-2">
                      @for (type of questionTypes; track type) {
                        <button
                          type="button"
                          (click)="addOfType(type)"
                          class="flex min-w-0 items-center gap-2.5 rounded-xl border border-themed px-3 py-2.5 text-left transition hover:border-brand-300"
                        >
                          <span
                            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                            [style.backgroundColor]="typeColor(type)"
                          >
                            <app-icon [name]="typeIcon(type)" [size]="15" />
                          </span>
                          <span class="min-w-0">
                            <span class="block truncate text-sm font-medium text-heading">
                              {{ t('questionTypes.' + type) }}
                            </span>
                            <span class="block truncate text-[11px] text-muted">
                              {{ t('questionTypeHints.' + type) }}
                            </span>
                          </span>
                        </button>
                      }
                    </div>
                  }

                  <p class="mt-4 flex items-start gap-2 text-xs text-muted">
                    <app-icon name="grip" [size]="14" class="mt-0.5 shrink-0" />
                    <span>{{ t('builder.dragHint') }}</span>
                  </p>

                  <div class="mt-3">
                    @if (questions().length === 0) {
                      <div class="surface-card rounded-2xl border">
                        <app-empty-state
                          icon="clipboard-list"
                          [title]="t('builder.emptyTitle')"
                          [description]="t('builder.emptyDesc')"
                        >
                          <button
                            type="button"
                            (click)="adding.set(true)"
                            class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white"
                          >
                            <app-icon name="plus" [size]="16" />
                            {{ t('builder.addQuestion') }}
                          </button>
                        </app-empty-state>
                      </div>
                    } @else {
                      <app-question-list
                        [questions]="questions()"
                        [selectedId]="selectedId()"
                        [conditional]="conditional()"
                        (select)="selectedId.set($event)"
                        (move)="onMove($event)"
                        (remove)="onRemoveQuestion($event)"
                        (duplicate)="onDuplicateQuestion($event)"
                      />
                    }
                  </div>
                </div>

                <div class="min-w-0 xl:col-span-7">
                  @if (selected(); as selected) {
                    <div class="grid gap-6 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                      <div class="surface-card min-w-0 rounded-2xl border p-5 md:p-6">
                        <h2 class="mb-5 text-base font-semibold text-heading">{{ t('builder.editorTitle') }}</h2>
                        <app-question-editor
                          [question]="selected"
                          (changed)="onQuestionPatch(selected.id, $event)"
                          (remove)="onRemoveQuestion(selected.id)"
                        />
                      </div>

                      <div class="min-w-0">
                        <div class="surface-card min-w-0 rounded-2xl border p-5 md:p-6">
                          <div class="mb-5 flex items-center justify-between gap-3">
                            <h2 class="text-base font-semibold text-heading">{{ t('builder.previewTitle') }}</h2>
                            <span
                              class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-medium text-success-700 dark:bg-success-500/15 dark:text-success-500"
                            >
                              <span class="h-1.5 w-1.5 rounded-full bg-success-500"></span>
                              {{ t('builder.previewLive') }}
                            </span>
                          </div>

                          <div class="mb-6">
                            <app-progress-bar
                              [current]="selectedIndex() + 1"
                              [total]="questions().length"
                              [percent]="previewPercent()"
                              [color]="survey()!.color"
                            />
                          </div>

                          <app-question-renderer
                            [question]="selected"
                            [value]="previewValue()"
                            (changed)="previewValue.set($event)"
                            [color]="survey()!.color"
                          />

                          <p class="mt-6 border-t border-themed pt-4 text-xs text-muted">
                            {{ t('builder.previewHint') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  } @else {
                    <div class="surface-card rounded-2xl border">
                      <app-empty-state
                        icon="edit"
                        [title]="t('builder.selectTitle')"
                        [description]="t('builder.selectDesc')"
                      />
                    </div>
                  }
                </div>
              </div>
            }

            @case (1) {
              <!-- Lógica -->
              <div>
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="max-w-2xl">
                    <h2 class="text-base font-semibold text-heading">{{ t('logic.title') }}</h2>
                    <p class="mt-1 text-sm text-muted">{{ t('logic.subtitle') }}</p>
                  </div>
                  <button
                    type="button"
                    (click)="addRule()"
                    [disabled]="questions().length < 2"
                    class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
                  >
                    <app-icon name="plus" [size]="16" />
                    {{ t('logic.addRule') }}
                  </button>
                </div>

                <div class="mt-5 grid gap-3 sm:grid-cols-3">
                  @for (action of actions; track action) {
                    <div class="rounded-xl border border-dashed border-themed p-4">
                      <p class="text-sm font-medium text-heading">{{ t('logic.actions.' + action) }}</p>
                      <p class="mt-1 text-xs text-muted">{{ t('logic.actionHints.' + action) }}</p>
                    </div>
                  }
                </div>

                @if (survey()!.logic.length === 0) {
                  <div class="surface-card mt-6 rounded-2xl border">
                    <app-empty-state
                      icon="git-branch"
                      [title]="t('logic.emptyTitle')"
                      [description]="t('logic.emptyDesc')"
                    />
                  </div>
                } @else {
                  <ul class="mt-6 flex flex-col gap-3">
                    @for (rule of survey()!.logic; track rule.id) {
                      <li
                        app-logic-rule-row
                        [rule]="rule"
                        [questions]="questions()"
                        (changed)="onRulePatch(rule.id, $event)"
                        (remove)="onRemoveRule(rule.id)"
                      ></li>
                    }
                  </ul>
                }
              </div>
            }

            @case (2) {
              <!-- Aparência -->
              <div class="grid gap-6 lg:grid-cols-3">
                <div class="surface-card min-w-0 rounded-2xl border p-5 md:p-6 lg:col-span-2">
                  <h2 class="text-base font-semibold text-heading">{{ t('appearance.title') }}</h2>
                  <p class="mt-1 text-sm text-muted">{{ t('appearance.subtitle') }}</p>

                  <div class="mt-6 flex flex-col gap-5">
                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="s-title">
                        {{ t('appearance.formTitle') }}
                      </label>
                      <input
                        id="s-title"
                        [value]="survey()!.title"
                        (input)="patch({ title: $any($event.target).value })"
                        class="focus-ring w-full rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
                      />
                    </div>

                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="s-desc">
                        {{ t('appearance.description') }}
                      </label>
                      <textarea
                        id="s-desc"
                        rows="3"
                        [value]="survey()!.description"
                        (input)="patch({ description: $any($event.target).value })"
                        class="focus-ring w-full resize-y rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
                      ></textarea>
                    </div>

                    <div>
                      <p class="mb-2 block text-sm font-medium text-heading">{{ t('appearance.color') }}</p>
                      <div class="flex flex-wrap items-center gap-2">
                        @for (color of colors; track color) {
                          <button
                            type="button"
                            [attr.aria-label]="color"
                            (click)="patch({ color: color })"
                            [class]="
                              'h-9 w-9 rounded-full border-2 transition ' +
                              (survey()!.color === color ? 'border-heading scale-110' : 'border-transparent')
                            "
                            [style.backgroundColor]="color"
                          ></button>
                        }
                        <input
                          type="color"
                          [value]="survey()!.color"
                          (input)="patch({ color: $any($event.target).value })"
                          [attr.aria-label]="t('appearance.customColor')"
                          class="h-9 w-12"
                        />
                      </div>
                    </div>

                    <div>
                      <p class="mb-2 block text-sm font-medium text-heading">{{ t('appearance.cover') }}</p>
                      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        @for (seed of covers; track seed) {
                          <button
                            type="button"
                            (click)="patch({ coverSeed: seed })"
                            [class]="
                              'relative overflow-hidden rounded-xl border-2 transition ' +
                              (survey()!.coverSeed === seed
                                ? 'border-brand-500'
                                : 'border-transparent hover:border-brand-200')
                            "
                          >
                            <img [src]="coverThumb(seed)" alt="" loading="lazy" class="h-20 w-full object-cover" />
                            @if (survey()!.coverSeed === seed) {
                              <span
                                class="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white"
                              >
                                <app-icon name="check" [size]="13" [strokeWidth]="3" />
                              </span>
                            }
                          </button>
                        }
                      </div>
                    </div>

                    <div>
                      <label class="mb-1.5 block text-sm font-medium text-heading" for="s-thanks">
                        {{ t('appearance.thankYou') }}
                      </label>
                      <textarea
                        id="s-thanks"
                        rows="3"
                        [value]="survey()!.thankYou"
                        (input)="patch({ thankYou: $any($event.target).value })"
                        class="focus-ring w-full resize-y rounded-lg border border-themed bg-transparent px-3.5 py-2.5 text-sm text-body"
                      ></textarea>
                      <p class="mt-1.5 text-xs text-muted">{{ t('appearance.thankYouHint') }}</p>
                    </div>
                  </div>
                </div>

                <div class="surface-card min-w-0 rounded-2xl border p-5 md:p-6">
                  <h2 class="text-base font-semibold text-heading">{{ t('appearance.previewTitle') }}</h2>
                  <div class="mt-4 overflow-hidden rounded-2xl border border-themed">
                    <img [src]="previewCover()" alt="" class="h-28 w-full object-cover" />
                    <div class="p-4">
                      <p class="text-sm font-semibold break-words text-heading">{{ survey()!.title }}</p>
                      <p class="mt-1 line-clamp-3 text-xs text-muted">{{ survey()!.description }}</p>
                      <span
                        class="mt-4 flex h-10 items-center justify-center rounded-lg text-xs font-medium text-white"
                        [style.backgroundColor]="survey()!.color"
                      >
                        {{ t('fill.start') }}
                      </span>
                    </div>
                  </div>
                  <p class="mt-4 text-xs text-muted">{{ t('appearance.previewHint') }}</p>
                </div>
              </div>
            }

            @default {
              <app-share-box [survey]="survey()!" />
            }
          }
        </app-tabs>
      }
    </ng-container>
  `,
})
export class BuilderPageComponent {
  private data = inject(SurveyService);
  private ui = inject(UiService);
  private route = inject(ActivatedRoute);
  private transloco = inject(TranslocoService);
  protected pl = usePlural();

  protected colors = COLORS;
  protected covers = COVERS;
  protected actions = ACTIONS;
  protected questionTypes = QUESTION_TYPES;

  private id = toSignal(this.route.paramMap.pipe(map((p) => Number(p.get('id') ?? 0))), { initialValue: 0 });
  // selectTranslate espera o JSON carregar — translate() puro devolveria a chave crua no título.
  private fallbackTitle = toSignal(this.transloco.selectTranslate<string>('builder.title'), { initialValue: '' });

  readonly tab = signal(0);
  readonly selectedId = signal<string | null>(null);
  readonly adding = signal(false);
  readonly previewValue = signal<AnswerValue | undefined>(undefined);

  readonly survey = computed(() => this.data.surveys().find((s) => s.id === this.id()));
  readonly questions = computed(() => {
    const s = this.survey();
    return s ? ordered(s.questions) : [];
  });
  readonly conditional = computed(() => conditionalIds(this.survey()?.logic ?? []));
  readonly selected = computed(() => this.questions().find((q) => q.id === this.selectedId()) ?? null);
  readonly selectedIndex = computed(() => this.questions().findIndex((q) => q.id === this.selectedId()));
  readonly previewPercent = computed(() =>
    Math.round((Math.max(0, this.selectedIndex()) / Math.max(1, this.questions().length)) * 100)
  );
  readonly previewCover = computed(() => {
    const s = this.survey();
    return s ? svImage(s.coverSeed, 640, 280) : '';
  });

  constructor() {
    // Título com o nome do formulário (literal, não passa pelo i18n).
    effect(() => {
      const survey = this.survey();
      const fallback = this.fallbackTitle();
      if (survey) setLiteralTitle(survey.title);
      else if (fallback) setLiteralTitle(fallback);
    });

    // Mantém uma pergunta selecionada quando a lista muda.
    effect(() => {
      const questions = this.questions();
      const current = this.selectedId();
      if (!current || !questions.some((q) => q.id === current)) {
        this.selectedId.set(questions[0]?.id ?? null);
      }
    });

    // A prévia recomeça em branco a cada pergunta selecionada.
    effect(() => {
      this.selectedId();
      this.previewValue.set(undefined);
    });
  }

  crumbs(t: (key: string) => string): Crumb[] {
    return [
      { label: t('appNav.forms'), href: '/app/formularios', icon: 'clipboard-list' },
      { label: this.survey()?.title ?? '' },
    ];
  }

  tabs(t: (key: string) => string): TabItem[] {
    return [
      { label: t('builder.tabs.questions'), icon: 'list' },
      { label: t('builder.tabs.logic'), icon: 'git-branch' },
      { label: t('builder.tabs.appearance'), icon: 'palette' },
      { label: t('builder.tabs.share'), icon: 'share' },
    ];
  }

  typeColor(type: QuestionType) {
    return QUESTION_COLOR[type];
  }
  typeIcon(type: QuestionType) {
    return QUESTION_ICON[type];
  }
  coverThumb(seed: string) {
    return svImage(seed, 320, 160);
  }

  patch(values: Record<string, unknown>) {
    const survey = this.survey();
    if (survey) this.data.updateSurvey(survey.id, values);
  }

  addOfType(type: QuestionType) {
    const survey = this.survey();
    if (!survey) return;
    const created = this.data.addQuestion(survey.id, type);
    this.adding.set(false);
    if (created) {
      this.selectedId.set(created.id);
      this.ui.notifySuccess(this.transloco.translate('builder.questionAdded'));
    }
  }

  onQuestionPatch(questionId: string, patch: Partial<Question>) {
    const survey = this.survey();
    if (survey) this.data.updateQuestion(survey.id, questionId, patch);
  }

  onMove(event: { from: number; to: number }) {
    const survey = this.survey();
    if (survey) this.data.moveQuestion(survey.id, event.from, event.to);
  }

  onRemoveQuestion(questionId: string) {
    const survey = this.survey();
    if (!survey) return;
    this.data.removeQuestion(survey.id, questionId);
    this.ui.notifySuccess(this.transloco.translate('builder.questionRemoved'));
  }

  onDuplicateQuestion(questionId: string) {
    const survey = this.survey();
    if (!survey) return;
    this.data.duplicateQuestion(survey.id, questionId);
    this.ui.notifySuccess(this.transloco.translate('builder.questionDuplicated'));
  }

  addRule() {
    const survey = this.survey();
    if (survey) this.data.addRule(survey.id);
  }

  onRulePatch(ruleId: string, patch: Partial<LogicRule>) {
    const survey = this.survey();
    if (survey) this.data.updateRule(survey.id, ruleId, patch);
  }

  onRemoveRule(ruleId: string) {
    const survey = this.survey();
    if (!survey) return;
    this.data.removeRule(survey.id, ruleId);
    this.ui.notifySuccess(this.transloco.translate('logic.ruleRemoved'));
  }

  publishSurvey() {
    const survey = this.survey();
    if (!survey) return;
    this.data.publishSurvey(survey.id);
    this.ui.notifySuccess(this.transloco.translate('forms.published'));
  }

  closeSurvey() {
    const survey = this.survey();
    if (!survey) return;
    this.data.closeSurvey(survey.id);
    this.ui.notifySuccess(this.transloco.translate('forms.closed'));
  }
}

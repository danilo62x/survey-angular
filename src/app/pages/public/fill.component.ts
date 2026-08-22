import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { setLiteralTitle, usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { FillingService } from '../../core/services/filling.service';
import { ordered, surveyBySlug, validateAnswer, type FieldError } from '../../core/data/query';
import { svImage } from '../../core/data/mock';
import { IconComponent } from '../../components/ui/icon-base.component';
import { ProgressBarComponent } from '../../components/sv/progress-bar.component';
import { QuestionRendererComponent } from '../../components/sv/question-renderer.component';
import type { AnswerValue } from '../../core/data/types';

@Component({
  selector: 'app-fill-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent, ProgressBarComponent, QuestionRendererComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (!survey()) {
        <div class="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <span
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15"
          >
            <app-icon name="clipboard-list" [size]="30" />
          </span>
          <h1 class="mt-6 text-xl font-semibold text-heading">{{ t('fill.notFoundTitle') }}</h1>
          <p class="mt-2 text-sm text-muted">{{ t('fill.notFoundDesc') }}</p>
          <a
            routerLink="/"
            class="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white"
          >
            <app-icon name="arrow-right" [size]="16" />
            {{ t('fill.backHome') }}
          </a>
        </div>
      } @else if (survey()!.status !== 'publicado') {
        <div class="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
          <span
            class="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-500/15"
          >
            <app-icon [name]="survey()!.status === 'encerrado' ? 'lock' : 'edit'" [size]="30" />
          </span>
          <h1 class="mt-6 text-xl font-semibold text-heading">
            {{ t(survey()!.status === 'encerrado' ? 'fill.closedTitle' : 'fill.draftTitle') }}
          </h1>
          <p class="mt-2 text-sm text-muted">
            {{ t(survey()!.status === 'encerrado' ? 'fill.closedDesc' : 'fill.draftDesc') }}
          </p>
          <a
            routerLink="/modelos"
            class="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white"
          >
            <app-icon name="layers" [size]="16" />
            {{ t('fill.seeTemplates') }}
          </a>
        </div>
      } @else {
        <div class="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-16">
          @if (intro()) {
            <div class="surface-card overflow-hidden rounded-3xl border shadow-theme-lg">
              <img [src]="cover()" alt="" class="h-40 w-full object-cover sm:h-56" />
              <div class="p-6 sm:p-8">
                <h1 class="text-title-sm font-bold break-words text-heading">{{ survey()!.title }}</h1>
                <p class="mt-3 text-sm text-muted sm:text-base">{{ survey()!.description }}</p>

                <dl class="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                  <div>
                    <dt class="text-xs text-muted">{{ t('fill.questionsCount') }}</dt>
                    <dd class="text-sm font-semibold text-heading">{{ questions().length }}</dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted">{{ t('fill.estimated') }}</dt>
                    <dd class="text-sm font-semibold text-heading">
                      {{ t('fill.minutes', { count: estimatedMinutes() }) }}
                    </dd>
                  </div>
                  <div>
                    <dt class="text-xs text-muted">{{ t('fill.oneAtATime') }}</dt>
                    <dd class="text-sm font-semibold text-heading">{{ t('fill.oneAtATimeValue') }}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  (click)="intro.set(false)"
                  class="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition sm:w-auto"
                  [style.backgroundColor]="survey()!.color"
                >
                  <app-icon name="play" [size]="18" />
                  {{ t('fill.start') }}
                </button>
              </div>
            </div>
          } @else {
            <div class="surface-card rounded-3xl border p-6 shadow-theme-lg sm:p-8">
              <div class="mb-8">
                <app-progress-bar
                  [current]="progress().current"
                  [total]="progress().total"
                  [percent]="progress().percent"
                  [color]="survey()!.color"
                />
              </div>

              @if (question(); as question) {
                <app-question-renderer
                  [question]="question"
                  [value]="currentValue()"
                  (changed)="onAnswer(question.id, $event)"
                  [error]="error()"
                  [color]="survey()!.color"
                />

                <div class="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    (click)="handleBack()"
                    [disabled]="progress().current <= 1"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-themed px-5 text-sm font-medium text-body transition hover:bg-gray-50 disabled:opacity-40 dark:hover:bg-gray-800"
                  >
                    <app-icon name="chevron-left" [size]="16" />
                    {{ t('common.back') }}
                  </button>

                  <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                    @if (!question.required) {
                      <button
                        type="button"
                        (click)="handleSkip()"
                        class="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium text-muted transition hover:text-heading"
                      >
                        {{ t('fill.skip') }}
                      </button>
                    }
                    <button
                      type="button"
                      (click)="handleNext()"
                      class="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-medium text-white transition"
                      [style.backgroundColor]="survey()!.color"
                    >
                      {{ isLast() ? t('fill.submit') : t('common.next') }}
                      <app-icon [name]="isLast() ? 'send' : 'arrow-right'" [size]="16" />
                    </button>
                  </div>
                </div>
              } @else {
                <div class="py-10 text-center">
                  <p class="text-sm text-muted">{{ t('fill.done') }}</p>
                  <button
                    type="button"
                    (click)="submitNow()"
                    class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-medium text-white"
                  >
                    <app-icon name="send" [size]="16" />
                    {{ t('fill.submit') }}
                  </button>
                </div>
              }

              <p class="mt-8 border-t border-themed pt-5 text-xs text-muted">{{ t('fill.logicHint') }}</p>
            </div>
          }
        </div>
      }
    </ng-container>
  `,
})
export class FillPageComponent {
  private data = inject(SurveyService);
  private filling = inject(FillingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), { initialValue: '' });

  readonly error = signal<FieldError | null>(null);
  readonly intro = signal(true);

  readonly survey = computed(() => surveyBySlug(this.data.surveys(), this.slug()));
  readonly questions = computed(() => {
    const s = this.survey();
    return s ? ordered(s.questions) : [];
  });
  readonly question = computed(() => this.questions()[this.filling.index()]);
  readonly currentValue = computed<AnswerValue | undefined>(() => {
    const q = this.question();
    return q ? this.filling.answers()[q.id] : undefined;
  });
  readonly progress = computed(() => {
    const s = this.survey();
    return s ? this.filling.progress(s) : { current: 0, total: 0, percent: 0 };
  });
  readonly isLast = computed(() => {
    const s = this.survey();
    return s ? this.filling.isLast(s) : false;
  });
  readonly cover = computed(() => {
    const s = this.survey();
    return s ? svImage(s.coverSeed, 960, 420) : '';
  });
  readonly estimatedMinutes = computed(() => Math.max(1, Math.round(this.questions().length * 0.6)));

  constructor() {
    // Título literal: o nome do formulário não passa pelo i18n.
    usePageTitle();
    let seen: number | null = null;
    this.route.paramMap.subscribe(() => {
      const survey = this.survey();
      if (!survey) {
        setLiteralTitle('');
        return;
      }
      setLiteralTitle(survey.title);
      if (seen !== survey.id) {
        seen = survey.id;
        this.filling.start(survey);
        this.data.registerView(survey.id);
        this.intro.set(
          !(this.filling.slug() === survey.slug && Object.keys(this.filling.answers()).length > 0)
        );
      }
    });
  }

  onAnswer(questionId: string, value: AnswerValue) {
    this.filling.setAnswer(questionId, value);
    this.error.set(null);
  }

  submitNow() {
    const survey = this.survey();
    if (!survey) return;
    const { answers, durationSec } = this.filling.submit(survey);
    this.data.registerResponse({
      surveyId: survey.id,
      answers,
      durationSec,
      completed: true,
      source: 'link',
    });
    this.router.navigateByUrl(`/f/${survey.slug}/obrigado`);
  }

  handleNext() {
    const survey = this.survey();
    if (!survey) return;
    const question = this.question();
    if (!question) {
      this.submitNow();
      return;
    }
    const value = this.filling.answers()[question.id];
    const err = validateAnswer(question, value);
    if (err) {
      this.error.set(err);
      return;
    }
    this.error.set(null);
    if (this.filling.isLast(survey)) {
      this.submitNow();
      return;
    }
    this.filling.goNext(survey);
  }

  handleSkip() {
    const survey = this.survey();
    if (!survey) return;
    this.error.set(null);
    if (this.filling.isLast(survey)) {
      this.handleNext();
      return;
    }
    this.filling.goNext(survey);
  }

  handleBack() {
    const survey = this.survey();
    if (!survey) return;
    this.error.set(null);
    this.filling.goBack(survey);
  }
}

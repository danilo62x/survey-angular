import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { usePageTitle } from '../../core/page-title';
import { SurveyService } from '../../core/services/survey.service';
import { FillingService } from '../../core/services/filling.service';
import { answerToText, ordered, surveyBySlug } from '../../core/data/query';
import { IconComponent } from '../../components/ui/icon-base.component';
import type { Question } from '../../core/data/types';

@Component({
  selector: 'app-thank-you-page',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-20" *transloco="let t">
      <div class="surface-card rounded-3xl border p-6 text-center shadow-theme-lg sm:p-10">
        <span
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/15"
        >
          <app-icon name="check-circle" [size]="32" />
        </span>
        <h1 class="mt-6 text-title-sm font-bold text-heading">{{ t('thanks.title') }}</h1>
        <p class="mx-auto mt-3 max-w-xl text-sm text-muted sm:text-base">
          {{ survey() ? survey()!.thankYou : t('thanks.generic') }}
        </p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            (click)="answerAgain()"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <app-icon name="refresh-cw" [size]="16" />
            {{ t('thanks.again') }}
          </button>
          <a
            routerLink="/"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-themed px-5 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon name="globe" [size]="16" />
            {{ t('thanks.home') }}
          </a>
        </div>
      </div>

      @if (rows().length > 0) {
        <section class="surface-card mt-6 rounded-3xl border p-6 sm:p-8">
          <h2 class="text-base font-semibold text-heading">{{ t('thanks.summary') }}</h2>
          <p class="mt-1 text-sm text-muted">{{ t('thanks.summaryDesc') }}</p>
          <dl class="mt-6 flex flex-col gap-4">
            @for (question of rows(); track question.id; let index = $index) {
              <div class="min-w-0 border-b border-themed pb-4 last:border-0 last:pb-0">
                <dt class="text-sm font-medium break-words text-heading">{{ index + 1 }}. {{ question.title }}</dt>
                <dd class="mt-1 text-sm break-words text-muted">{{ answerText(question) }}</dd>
              </div>
            }
          </dl>
        </section>
      }
    </div>
  `,
})
export class ThankYouPageComponent {
  private data = inject(SurveyService);
  private filling = inject(FillingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), { initialValue: '' });

  constructor() {
    usePageTitle('thanks.title');
  }

  readonly survey = computed(() => surveyBySlug(this.data.surveys(), this.slug()));

  readonly answered = computed(() => {
    const survey = this.survey();
    return survey && this.filling.slug() === survey.slug ? this.filling.submittedAnswers() : {};
  });

  readonly rows = computed(() => {
    const survey = this.survey();
    if (!survey) return [];
    const answered = this.answered();
    return ordered(survey.questions).filter((q) => answered[q.id] !== undefined);
  });

  answerText(question: Question) {
    return answerToText(this.answered()[question.id]);
  }

  answerAgain() {
    this.filling.restart();
    this.router.navigateByUrl(`/f/${this.slug()}`);
  }
}

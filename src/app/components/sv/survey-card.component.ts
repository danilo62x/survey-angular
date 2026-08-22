import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import type { SurveyStats } from '../../core/data/types';
import { svImage } from '../../core/data/mock';
import { IconComponent } from '../ui/icon-base.component';
import { SurveyStatusComponent } from './status-pill.component';

@Component({
  selector: 'app-survey-card',
  standalone: true,
  imports: [RouterLink, TranslocoModule, IconComponent, SurveyStatusComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="surface-card flex flex-col overflow-hidden rounded-2xl border shadow-theme-sm transition hover:shadow-theme-md"
      *transloco="let t"
    >
      <a [routerLink]="'/app/formularios/' + survey().id" class="relative block h-32 overflow-hidden">
        <img
          [src]="cover()"
          alt=""
          loading="lazy"
          class="h-full w-full object-cover transition duration-300 hover:scale-105"
        />
        <span class="absolute top-3 left-3">
          <app-survey-status [status]="survey().status" />
        </span>
      </a>

      <div class="flex min-w-0 flex-1 flex-col p-5">
        <h3 class="text-base font-semibold break-words text-heading">{{ survey().title }}</h3>
        <p class="mt-1.5 line-clamp-2 text-sm text-muted">{{ survey().description }}</p>

        <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60">
            <dt class="truncate text-[11px] text-muted">{{ t('forms.responses') }}</dt>
            <dd class="text-sm font-semibold text-heading">{{ stats().responses }}</dd>
          </div>
          <div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60">
            <dt class="truncate text-[11px] text-muted">{{ t('forms.completion') }}</dt>
            <dd class="text-sm font-semibold text-heading">{{ completionPercent() }}%</dd>
          </div>
          <div class="min-w-0 rounded-lg bg-gray-50 px-2 py-2 dark:bg-gray-800/60">
            <dt class="truncate text-[11px] text-muted">{{ t('forms.nps') }}</dt>
            <dd class="text-sm font-semibold text-heading">{{ stats().nps === null ? '—' : stats().nps }}</dd>
          </div>
        </dl>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <a
            [routerLink]="'/app/formularios/' + survey().id"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon name="edit" [size]="14" />
            {{ t('forms.edit') }}
          </a>
          <a
            [routerLink]="'/app/formularios/' + survey().id + '/respostas'"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-themed px-3 text-xs font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <app-icon name="chart" [size]="14" />
            {{ t('forms.results') }}
          </a>
          @if (survey().status === 'publicado') {
            <a
              [routerLink]="'/f/' + survey().slug"
              class="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              <app-icon name="external-link" [size]="14" />
              {{ t('forms.open') }}
            </a>
          }
        </div>
      </div>
    </article>
  `,
})
export class SurveyCardComponent {
  readonly stats = input.required<SurveyStats>();

  readonly survey = computed(() => this.stats().survey);
  readonly cover = computed(() => svImage(this.survey().coverSeed, 640, 320));
  readonly completionPercent = computed(() => Math.round(this.stats().completionRate * 100));
}

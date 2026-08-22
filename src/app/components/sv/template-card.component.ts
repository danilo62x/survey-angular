import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { TemplateModel } from '../../core/data/types';
import { svImage } from '../../core/data/mock';
import { IconComponent } from '../ui/icon-base.component';
import { QUESTION_ICON } from '../../lib/question-types';
import { usePlural } from '../../lib/i18n';

@Component({
  selector: 'app-template-card',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="surface-card flex flex-col overflow-hidden rounded-2xl border shadow-theme-sm transition hover:shadow-theme-md"
      *transloco="let t"
    >
      @if (showCover()) {
        <div class="relative h-28 overflow-hidden">
          <img [src]="cover()" alt="" loading="lazy" class="h-full w-full object-cover" />
          <span
            class="absolute bottom-3 left-4 flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-theme-md"
            [style.backgroundColor]="template().color"
          >
            <app-icon [name]="template().icon" [size]="20" />
          </span>
        </div>
      }

      <div class="flex min-w-0 flex-1 flex-col p-5">
        <div class="flex min-w-0 items-start gap-3">
          @if (!showCover()) {
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
              [style.backgroundColor]="template().color"
            >
              <app-icon [name]="template().icon" [size]="20" />
            </span>
          }
          <div class="min-w-0">
            <h3 class="text-base font-semibold break-words text-heading">{{ template().name }}</h3>
            <p class="mt-1 text-sm text-muted">{{ template().objective }}</p>
          </div>
        </div>

        <ul class="mt-4 flex flex-1 flex-col gap-1.5">
          @for (question of preview(); track question.id) {
            <li class="flex min-w-0 items-center gap-2 text-xs text-muted">
              <app-icon [name]="questionIcon(question.type)" [size]="13" class="shrink-0" />
              <span class="min-w-0 truncate">{{ question.title }}</span>
            </li>
          }
          @if (extra() > 0) {
            <li class="text-xs text-muted">{{ t(pl('templates.more', extra()), { count: extra() }) }}</li>
          }
        </ul>

        <div class="mt-5 flex items-center justify-between gap-3">
          <span class="text-xs text-muted">
            {{ t(pl('templates.questionCount', count()), { count: count() }) }}
          </span>
          <button
            type="button"
            (click)="action.emit()"
            class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-xs font-medium text-white transition hover:bg-brand-600"
          >
            <app-icon name="plus" [size]="14" />
            {{ actionLabel() }}
          </button>
        </div>
      </div>
    </article>
  `,
})
export class TemplateCardComponent {
  readonly template = input.required<TemplateModel>();
  /** Ação principal — "Usar este modelo" na área logada, "Ver perguntas" no site. */
  readonly actionLabel = input<string>('');
  readonly showCover = input<boolean>(true);
  readonly action = output<void>();

  protected pl = usePlural();

  readonly preview = computed(() => this.template().questions.slice(0, 4));
  readonly count = computed(() => this.template().questions.length);
  readonly extra = computed(() => this.count() - this.preview().length);
  readonly cover = computed(() => svImage(this.template().slug, 640, 280));

  questionIcon(type: TemplateModel['questions'][number]['type']) {
    return QUESTION_ICON[type];
  }
}

import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { Question } from '../../core/data/types';
import { IconComponent } from '../ui/icon-base.component';
import { QUESTION_ICON } from '../../lib/question-types';

/** Lista arrastável de perguntas — com setas para quem não usa o mouse. */
@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-2" *transloco="let t">
      @for (question of questions(); track question.id; let index = $index) {
        <li
          draggable="true"
          (dragstart)="dragIndex.set(index)"
          (dragend)="clearDrag()"
          (dragover)="onDragOver($event, index)"
          (drop)="onDrop($event, index)"
          [class]="itemClass(question.id, index)"
        >
          <span class="cursor-grab text-gray-400 active:cursor-grabbing" [title]="t('builder.dragHint')">
            <app-icon name="grip" [size]="16" />
          </span>

          <button
            type="button"
            (click)="select.emit(question.id)"
            class="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          >
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-muted dark:bg-gray-800"
            >
              <app-icon [name]="icon(question)" [size]="14" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-heading">
                {{ index + 1 }}. {{ question.title || t('builder.untitledQuestion') }}
              </span>
              <span class="flex items-center gap-1.5 text-[11px] text-muted">
                {{ t('questionTypes.' + question.type) }}
                @if (question.required) {
                  <span class="text-error-500">*</span>
                }
                @if (conditional().has(question.id)) {
                  <span class="inline-flex items-center gap-1 text-brand-500">
                    <app-icon name="git-branch" [size]="11" />
                    {{ t('builder.conditional') }}
                  </span>
                }
              </span>
            </span>
          </button>

          <div
            class="flex shrink-0 items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100"
          >
            <button
              type="button"
              (click)="move.emit({ from: index, to: index - 1 })"
              [disabled]="index === 0"
              [title]="t('builder.moveUp')"
              [attr.aria-label]="t('builder.moveUp')"
              class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading disabled:opacity-30"
            >
              <app-icon name="chevron-up" [size]="14" />
            </button>
            <button
              type="button"
              (click)="move.emit({ from: index, to: index + 1 })"
              [disabled]="index === questions().length - 1"
              [title]="t('builder.moveDown')"
              [attr.aria-label]="t('builder.moveDown')"
              class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading disabled:opacity-30"
            >
              <app-icon name="chevron-down" [size]="14" />
            </button>
            <button
              type="button"
              (click)="duplicate.emit(question.id)"
              [title]="t('builder.duplicateQuestion')"
              [attr.aria-label]="t('builder.duplicateQuestion')"
              class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-heading"
            >
              <app-icon name="copy" [size]="14" />
            </button>
            <button
              type="button"
              (click)="remove.emit(question.id)"
              [title]="t('builder.removeQuestion')"
              [attr.aria-label]="t('builder.removeQuestion')"
              class="flex h-7 w-7 items-center justify-center rounded-md text-muted transition hover:text-error-500"
            >
              <app-icon name="trash" [size]="14" />
            </button>
          </div>
        </li>
      }
    </ul>
  `,
})
export class QuestionListComponent {
  readonly questions = input<Question[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly conditional = input<Set<string>>(new Set<string>());

  readonly select = output<string>();
  readonly move = output<{ from: number; to: number }>();
  readonly remove = output<string>();
  readonly duplicate = output<string>();

  readonly dragIndex = signal<number | null>(null);
  readonly overIndex = signal<number | null>(null);

  icon(question: Question) {
    return QUESTION_ICON[question.type];
  }

  itemClass(id: string, index: number) {
    const active = id === this.selectedId();
    const over = this.overIndex() === index && this.dragIndex() !== null && this.dragIndex() !== index;
    return (
      'group flex items-center gap-2 rounded-xl border px-3 py-2.5 transition ' +
      (active ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-themed surface-card') +
      (over ? ' ring-2 ring-brand-300' : '') +
      (this.dragIndex() === index ? ' opacity-50' : '')
    );
  }

  clearDrag() {
    this.dragIndex.set(null);
    this.overIndex.set(null);
  }

  onDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.overIndex.set(index);
  }

  onDrop(event: DragEvent, to: number) {
    event.preventDefault();
    const from = this.dragIndex();
    if (from !== null && from !== to) this.move.emit({ from, to });
    this.clearDrag();
  }
}

import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import type { Choice, Question, QuestionType } from '../../core/data/types';
import { IconComponent } from '../ui/icon-base.component';
import { SwitchToggleComponent } from '../ui/switch-toggle.component';
import { QUESTION_ICON, QUESTION_TYPES, hasChoices, hasRange, isMatrix } from '../../lib/question-types';

const labelClass = 'mb-1.5 block text-sm font-medium text-heading';
const control =
  'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2.5 text-sm text-body placeholder:text-muted';

/** Painel lateral que edita a pergunta selecionada no construtor. */
@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [TranslocoModule, IconComponent, SwitchToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-5" *transloco="let t">
      <div>
        <label [class]="labelClass" for="q-type">{{ t('builder.fields.type') }}</label>
        <div class="relative">
          <span class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <app-icon [name]="typeIcon()" [size]="16" />
          </span>
          <select
            id="q-type"
            [value]="question().type"
            (change)="changeType($any($event.target).value)"
            [class]="control + ' pl-9'"
          >
            @for (type of questionTypes; track type) {
              <option [value]="type" [selected]="type === question().type">{{ t('questionTypes.' + type) }}</option>
            }
          </select>
        </div>
      </div>

      <div>
        <label [class]="labelClass" for="q-title">{{ t('builder.fields.title') }}</label>
        <textarea
          id="q-title"
          rows="2"
          [value]="question().title"
          (input)="changed.emit({ title: $any($event.target).value })"
          [placeholder]="t('builder.fields.titlePlaceholder')"
          [class]="control + ' resize-y'"
        ></textarea>
      </div>

      <div>
        <label [class]="labelClass" for="q-help">{{ t('builder.fields.help') }}</label>
        <input
          id="q-help"
          [value]="question().help"
          (input)="changed.emit({ help: $any($event.target).value })"
          [placeholder]="t('builder.fields.helpPlaceholder')"
          [class]="control"
        />
      </div>

      <div class="flex items-center justify-between rounded-xl border border-themed px-4 py-3">
        <div class="min-w-0 pr-3">
          <p class="text-sm font-medium text-heading">{{ t('builder.fields.required') }}</p>
          <p class="text-xs text-muted">{{ t('builder.fields.requiredHint') }}</p>
        </div>
        <app-switch-toggle [checked]="question().required" (changed)="changed.emit({ required: $event })" />
      </div>

      @if (showChoices()) {
        <div>
          <p [class]="labelClass">{{ t('builder.fields.options') }}</p>
          <ul class="flex flex-col gap-2">
            @for (choice of question().choices; track choice.id) {
              <li class="flex items-center gap-2">
                <input
                  [value]="choice.label"
                  (input)="setChoice(choice.id, $any($event.target).value)"
                  [class]="control"
                />
                <button
                  type="button"
                  (click)="removeChoice(choice.id)"
                  [disabled]="question().choices.length <= 1"
                  [attr.aria-label]="t('common.remove')"
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500 disabled:opacity-40"
                >
                  <app-icon name="trash" [size]="15" />
                </button>
              </li>
            }
          </ul>
          <button
            type="button"
            (click)="addChoice()"
            class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400"
          >
            <app-icon name="plus" [size]="15" />
            {{ t('builder.addOption') }}
          </button>
        </div>
      }

      @if (showRange()) {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label [class]="labelClass" for="q-min">{{ t('builder.fields.min') }}</label>
            <input
              id="q-min"
              type="number"
              [value]="question().min ?? ''"
              (input)="setBound('min', $any($event.target).value)"
              [class]="control"
            />
          </div>
          <div>
            <label [class]="labelClass" for="q-max">{{ t('builder.fields.max') }}</label>
            <input
              id="q-max"
              type="number"
              [value]="question().max ?? ''"
              (input)="setBound('max', $any($event.target).value)"
              [class]="control"
            />
          </div>
        </div>
      }

      @if (showMatrix()) {
        @for (key of listKeys; track key) {
          <div>
            <p [class]="labelClass">
              {{ t(key === 'rows' ? 'builder.fields.rows' : 'builder.fields.columns') }}
            </p>
            <ul class="flex flex-col gap-2">
              @for (item of listOf(key); track $index; let i = $index) {
                <li class="flex items-center gap-2">
                  <input [value]="item" (input)="setListItem(key, i, $any($event.target).value)" [class]="control" />
                  <button
                    type="button"
                    (click)="removeListItem(key, i)"
                    [disabled]="listOf(key).length <= 1"
                    [attr.aria-label]="t('common.remove')"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500 disabled:opacity-40"
                  >
                    <app-icon name="trash" [size]="15" />
                  </button>
                </li>
              }
            </ul>
            <button
              type="button"
              (click)="addListItem(key)"
              class="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400"
            >
              <app-icon name="plus" [size]="15" />
              {{ t(key === 'rows' ? 'builder.addRow' : 'builder.addColumn') }}
            </button>
          </div>
        }
      }

      <button
        type="button"
        (click)="remove.emit()"
        class="inline-flex items-center justify-center gap-2 rounded-lg border border-error-200 px-4 py-2.5 text-sm font-medium text-error-600 transition hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
      >
        <app-icon name="trash" [size]="16" />
        {{ t('builder.removeQuestion') }}
      </button>
    </div>
  `,
})
export class QuestionEditorComponent {
  readonly question = input.required<Question>();
  readonly changed = output<Partial<Question>>();
  readonly remove = output<void>();

  private transloco = inject(TranslocoService);

  protected labelClass = labelClass;
  protected control = control;
  protected questionTypes = QUESTION_TYPES;
  protected listKeys: ('rows' | 'columns')[] = ['rows', 'columns'];

  typeIcon() {
    return QUESTION_ICON[this.question().type];
  }

  showChoices() {
    return hasChoices(this.question().type);
  }
  showRange() {
    return hasRange(this.question().type);
  }
  showMatrix() {
    return isMatrix(this.question().type);
  }

  listOf(key: 'rows' | 'columns'): string[] {
    return this.question()[key];
  }

  setChoice(id: string, value: string) {
    this.changed.emit({
      choices: this.question().choices.map((c) => (c.id === id ? { ...c, label: value } : c)),
    });
  }

  addChoice() {
    const q = this.question();
    const next: Choice = {
      id: `${q.id}-o${q.choices.length + 1}-${Math.random().toString(36).slice(2, 5)}`,
      label: this.transloco.translate('builder.newOption', { index: q.choices.length + 1 }),
    };
    this.changed.emit({ choices: [...q.choices, next] });
  }

  removeChoice(id: string) {
    this.changed.emit({ choices: this.question().choices.filter((c) => c.id !== id) });
  }

  setBound(key: 'min' | 'max', raw: string) {
    this.changed.emit({ [key]: raw === '' ? null : Number(raw) } as Partial<Question>);
  }

  setListItem(key: 'rows' | 'columns', index: number, value: string) {
    this.changed.emit({
      [key]: this.question()[key].map((item, i) => (i === index ? value : item)),
    } as Partial<Question>);
  }

  addListItem(key: 'rows' | 'columns') {
    this.changed.emit({
      [key]: [
        ...this.question()[key],
        this.transloco.translate(key === 'rows' ? 'builder.newRow' : 'builder.newColumn'),
      ],
    } as Partial<Question>);
  }

  removeListItem(key: 'rows' | 'columns', index: number) {
    this.changed.emit({
      [key]: this.question()[key].filter((_, i) => i !== index),
    } as Partial<Question>);
  }

  changeType(type: QuestionType) {
    const question = this.question();
    const patch: Partial<Question> = { type };
    if (hasChoices(type) && question.choices.length === 0) {
      patch.choices = [1, 2, 3].map((n) => ({
        id: `${question.id}-o${n}`,
        label: this.transloco.translate('builder.newOption', { index: n }),
      }));
    }
    if (type === 'escala' && question.min === null) {
      patch.min = 1;
      patch.max = 5;
    }
    if (type === 'numero' && question.min === null) {
      patch.min = 0;
      patch.max = 100;
    }
    if (isMatrix(type) && question.rows.length === 0) {
      patch.rows = [this.transloco.translate('builder.newRow')];
      patch.columns = [this.transloco.translate('builder.newColumn')];
    }
    this.changed.emit(patch);
  }
}

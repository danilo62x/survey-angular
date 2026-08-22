import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { AnswerValue, Question } from '../../core/data/types';
import type { FieldError } from '../../core/data/query';
import { IconComponent } from '../ui/icon-base.component';

const controlBase = 'focus-ring w-full rounded-xl border bg-transparent px-4 py-3 text-sm text-body placeholder:text-muted';

@Component({
  selector: 'app-question-renderer',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-w-0" *transloco="let t">
      <h2 class="text-lg font-semibold text-heading sm:text-xl">
        {{ question().title || t('builder.untitledQuestion') }}
        @if (question().required) {
          <span class="ml-1 text-error-500">*</span>
        }
      </h2>
      @if (question().help) {
        <p class="mt-1.5 text-sm text-muted">{{ question().help }}</p>
      }

      <div class="mt-5">
        @switch (question().type) {
          @case ('texto-longo') {
            <textarea
              rows="5"
              [disabled]="preview()"
              [value]="textValue()"
              (input)="onChange($any($event.target).value)"
              [placeholder]="t('fill.placeholders.longText')"
              [class]="controlClass + ' resize-y'"
            ></textarea>
          }
          @case ('email') {
            <input
              type="email"
              inputmode="email"
              [disabled]="preview()"
              [value]="textValue()"
              (input)="onChange($any($event.target).value)"
              placeholder="voce@empresa.com"
              [class]="controlClass"
            />
          }
          @case ('numero') {
            <input
              type="number"
              inputmode="numeric"
              [disabled]="preview()"
              [attr.min]="question().min"
              [attr.max]="question().max"
              [value]="rawValue()"
              (input)="onNumber($any($event.target).value)"
              [placeholder]="numberPlaceholder(t)"
              [class]="controlClass"
            />
          }
          @case ('data') {
            <input
              type="date"
              [disabled]="preview()"
              [value]="textValue()"
              (input)="onChange($any($event.target).value)"
              [class]="controlClass"
            />
          }
          @case ('escolha-unica') {
            <div class="flex flex-col gap-2">
              @for (choice of question().choices; track choice.id) {
                <button
                  type="button"
                  [disabled]="preview()"
                  (click)="onChange(choice.label)"
                  [class]="optionClass(value() === choice.label)"
                >
                  <span
                    [class]="
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ' +
                      (value() === choice.label ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600')
                    "
                  >
                    @if (value() === choice.label) {
                      <span class="h-2.5 w-2.5 rounded-full" [style.backgroundColor]="color()"></span>
                    }
                  </span>
                  <span class="min-w-0 flex-1 break-words">{{ choice.label }}</span>
                </button>
              }
            </div>
          }
          @case ('multipla-escolha') {
            <div class="flex flex-col gap-2">
              @for (choice of question().choices; track choice.id) {
                <button
                  type="button"
                  [disabled]="preview()"
                  (click)="toggleChoice(choice.label)"
                  [class]="optionClass(isSelected(choice.label))"
                >
                  <span
                    [class]="
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ' +
                      (isSelected(choice.label) ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600')
                    "
                    [style.backgroundColor]="isSelected(choice.label) ? color() : null"
                    [style.borderColor]="isSelected(choice.label) ? color() : null"
                  >
                    @if (isSelected(choice.label)) {
                      <app-icon name="check" [size]="12" [strokeWidth]="3" class="text-white" />
                    }
                  </span>
                  <span class="min-w-0 flex-1 break-words">{{ choice.label }}</span>
                </button>
              }
            </div>
          }
          @case ('escala') {
            <div>
              <div class="flex flex-wrap gap-2">
                @for (step of scaleSteps(); track step) {
                  <button
                    type="button"
                    [disabled]="preview()"
                    (click)="onChange(step)"
                    [class]="
                      'h-11 min-w-11 flex-1 rounded-xl border text-sm font-semibold transition sm:flex-none ' +
                      (numberValue() === step ? 'text-white' : 'border-themed text-body hover:border-brand-300')
                    "
                    [style.backgroundColor]="numberValue() === step ? color() : null"
                    [style.borderColor]="numberValue() === step ? color() : null"
                  >
                    {{ step }}
                  </button>
                }
              </div>
              <div class="mt-2 flex justify-between text-xs text-muted">
                <span>{{ t('fill.scaleLow') }}</span>
                <span>{{ t('fill.scaleHigh') }}</span>
              </div>
            </div>
          }
          @case ('nps') {
            <div>
              <div class="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                @for (step of npsSteps; track step) {
                  <button
                    type="button"
                    [disabled]="preview()"
                    (click)="onChange(step)"
                    [class]="
                      'h-11 rounded-lg border text-sm font-semibold transition ' +
                      (numberValue() === step ? 'text-white' : 'border-themed text-body hover:border-brand-300')
                    "
                    [style.backgroundColor]="numberValue() === step ? npsTone(step) : null"
                    [style.borderColor]="numberValue() === step ? npsTone(step) : null"
                  >
                    {{ step }}
                  </button>
                }
              </div>
              <div class="mt-2 flex justify-between text-xs text-muted">
                <span>{{ t('fill.npsLow') }}</span>
                <span>{{ t('fill.npsHigh') }}</span>
              </div>
            </div>
          }
          @case ('matriz') {
            <div class="-mx-1 overflow-x-auto px-1">
              <table class="w-full min-w-[32rem] border-collapse text-sm">
                <thead>
                  <tr>
                    <th class="w-1/3 px-2 pb-2 text-left text-xs font-medium text-muted"></th>
                    @for (column of question().columns; track column) {
                      <th class="px-2 pb-2 text-center text-xs font-medium text-muted">{{ column }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of question().rows; track row) {
                    <tr class="border-t border-themed">
                      <th scope="row" class="py-3 pr-3 text-left text-sm font-medium text-body">{{ row }}</th>
                      @for (column of question().columns; track column) {
                        <td class="px-2 py-3 text-center">
                          <button
                            type="button"
                            [disabled]="preview()"
                            [attr.aria-label]="row + ' — ' + column"
                            (click)="setMatrix(row, column)"
                            [class]="
                              'mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 transition ' +
                              (matrixValue()[row] === column
                                ? 'border-brand-500'
                                : 'border-gray-300 dark:border-gray-600')
                            "
                          >
                            @if (matrixValue()[row] === column) {
                              <span class="h-3 w-3 rounded-full" [style.backgroundColor]="color()"></span>
                            }
                          </button>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @default {
            <input
              type="text"
              [disabled]="preview()"
              [value]="textValue()"
              (input)="onChange($any($event.target).value)"
              [placeholder]="t('fill.placeholders.shortText')"
              [class]="controlClass"
            />
          }
        }
      </div>

      @if (error()) {
        <p class="mt-2 flex items-center gap-1.5 text-sm text-error-500">
          <app-icon name="alert-triangle" [size]="14" />
          {{ t(error()!.key, error()!.params ?? {}) }}
        </p>
      }
    </div>
  `,
})
export class QuestionRendererComponent {
  readonly question = input.required<Question>();
  readonly value = input<AnswerValue | undefined>(undefined);
  readonly error = input<FieldError | null>(null);
  readonly color = input<string>('#465fff');
  /** Modo prévia: os controles ficam visíveis, porém inertes. */
  readonly preview = input<boolean>(false);

  readonly changed = output<AnswerValue>();

  protected npsSteps = Array.from({ length: 11 }, (_, i) => i);

  get controlClass() {
    return `${controlBase} ${this.error() ? 'border-error-500' : 'border-themed'}`;
  }

  readonly textValue = computed(() => (typeof this.value() === 'string' ? (this.value() as string) : ''));
  readonly rawValue = computed(() => {
    const v = this.value();
    return v === undefined || v === null ? '' : String(v);
  });
  readonly numberValue = computed(() => Number(this.value()));
  readonly selectedList = computed(() => (Array.isArray(this.value()) ? (this.value() as string[]) : []));
  readonly matrixValue = computed(() => {
    const v = this.value();
    return (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, string>;
  });
  readonly scaleSteps = computed(() => {
    const min = this.question().min ?? 1;
    const max = this.question().max ?? 5;
    return Array.from({ length: max - min + 1 }, (_, i) => min + i);
  });

  optionClass(active: boolean) {
    return (
      'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ' +
      (active
        ? 'border-brand-500 bg-brand-50 text-heading dark:bg-brand-500/15'
        : 'border-themed text-body hover:border-brand-300') +
      (this.preview() ? ' cursor-default' : ' cursor-pointer')
    );
  }

  numberPlaceholder(t: (key: string, params?: Record<string, unknown>) => string) {
    const q = this.question();
    return q.min !== null && q.max !== null
      ? t('fill.placeholders.numberRange', { min: q.min, max: q.max })
      : t('fill.placeholders.number');
  }

  npsTone(step: number) {
    return step <= 6 ? '#f04438' : step <= 8 ? '#f79009' : '#12b76a';
  }

  isSelected(label: string) {
    return this.selectedList().includes(label);
  }

  toggleChoice(label: string) {
    const list = this.selectedList();
    this.onChange(list.includes(label) ? list.filter((v) => v !== label) : [...list, label]);
  }

  setMatrix(row: string, column: string) {
    this.onChange({ ...this.matrixValue(), [row]: column });
  }

  onNumber(raw: string) {
    this.onChange(raw === '' ? '' : Number(raw));
  }

  onChange(value: AnswerValue) {
    if (this.preview()) return;
    this.changed.emit(value);
  }
}

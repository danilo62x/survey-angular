import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import type { LogicAction, LogicOperator, LogicRule, Question } from '../../core/data/types';
import { IconComponent } from '../ui/icon-base.component';

const OPERATORS: LogicOperator[] = ['igual', 'diferente', 'maior', 'menor', 'contem'];
const ACTIONS: LogicAction[] = ['pular-para', 'mostrar', 'esconder'];

const control = 'focus-ring w-full rounded-lg border border-themed bg-transparent px-3 py-2 text-sm text-body';

/** Uma regra: "se a resposta de X for Y, então ação sobre Z". */
@Component({
  // Seletor de atributo em <li> para a lista continuar sendo <ul><li>.
  selector: 'li[app-logic-rule-row]',
  standalone: true,
  imports: [TranslocoModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'surface-card block rounded-xl border p-4' },
  template: `
    <ng-container *transloco="let t">
      <div class="grid gap-3 lg:grid-cols-12">
        <div class="lg:col-span-4">
          <label class="mb-1 block text-xs font-medium text-muted">{{ t('logic.ifAnswer') }}</label>
          <select
            [value]="rule().questionId"
            (change)="changed.emit({ questionId: $any($event.target).value, value: '' })"
            [class]="control"
          >
            @for (q of questions(); track q.id; let i = $index) {
              <option [value]="q.id" [selected]="q.id === rule().questionId">
                {{ i + 1 }}. {{ q.title || t('builder.untitledQuestion') }}
              </option>
            }
          </select>
        </div>

        <div class="lg:col-span-2">
          <label class="mb-1 block text-xs font-medium text-muted">{{ t('logic.operator') }}</label>
          <select
            [value]="rule().operator"
            (change)="changed.emit({ operator: $any($event.target).value })"
            [class]="control"
          >
            @for (op of operators; track op) {
              <option [value]="op" [selected]="op === rule().operator">{{ t('logic.operators.' + op) }}</option>
            }
          </select>
        </div>

        <div class="lg:col-span-2">
          <label class="mb-1 block text-xs font-medium text-muted">{{ t('logic.value') }}</label>
          @if (useSelect()) {
            <select [value]="rule().value" (change)="changed.emit({ value: $any($event.target).value })" [class]="control">
              <option value="">{{ t('logic.choose') }}</option>
              @for (c of source()!.choices; track c.id) {
                <option [value]="c.label" [selected]="c.label === rule().value">{{ c.label }}</option>
              }
            </select>
          } @else {
            <input
              [type]="numeric() ? 'number' : 'text'"
              [value]="rule().value"
              (input)="changed.emit({ value: $any($event.target).value })"
              [placeholder]="t('logic.valuePlaceholder')"
              [class]="control"
            />
          }
        </div>

        <div class="lg:col-span-2">
          <label class="mb-1 block text-xs font-medium text-muted">{{ t('logic.action') }}</label>
          <select
            [value]="rule().action"
            (change)="changed.emit({ action: $any($event.target).value })"
            [class]="control"
          >
            @for (action of actions; track action) {
              <option [value]="action" [selected]="action === rule().action">
                {{ t('logic.actions.' + action) }}
              </option>
            }
          </select>
        </div>

        <div class="flex items-end gap-2 lg:col-span-2">
          <div class="min-w-0 flex-1">
            <label class="mb-1 block text-xs font-medium text-muted">{{ t('logic.target') }}</label>
            <select
              [value]="rule().targetId"
              (change)="changed.emit({ targetId: $any($event.target).value })"
              [class]="control"
            >
              @for (q of questions(); track q.id; let i = $index) {
                <option [value]="q.id" [selected]="q.id === rule().targetId">
                  {{ i + 1 }}. {{ q.title || t('builder.untitledQuestion') }}
                </option>
              }
            </select>
          </div>
          <button
            type="button"
            (click)="remove.emit()"
            [attr.aria-label]="t('logic.removeRule')"
            [title]="t('logic.removeRule')"
            class="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-themed text-muted transition hover:text-error-500"
          >
            <app-icon name="trash" [size]="15" />
          </button>
        </div>
      </div>

      <p class="mt-3 flex items-start gap-2 text-xs text-muted">
        <app-icon name="git-branch" [size]="14" class="mt-0.5 shrink-0" />
        <span class="min-w-0">{{ sentence() }}</span>
      </p>
    </ng-container>
  `,
})
export class LogicRuleRowComponent {
  readonly rule = input.required<LogicRule>();
  readonly questions = input<Question[]>([]);
  readonly changed = output<Partial<LogicRule>>();
  readonly remove = output<void>();

  private transloco = inject(TranslocoService);

  protected control = control;
  protected operators = OPERATORS;
  protected actions = ACTIONS;

  readonly source = computed(() => this.questions().find((q) => q.id === this.rule().questionId));
  readonly numeric = computed(() => {
    const s = this.source();
    return s ? ['escala', 'nps', 'numero'].includes(s.type) : false;
  });
  readonly useSelect = computed(() => {
    const s = this.source();
    const op = this.rule().operator;
    return !!s && s.choices.length > 0 && (op === 'igual' || op === 'diferente');
  });

  sentence() {
    const rule = this.rule();
    const untitled = this.transloco.translate('builder.untitledQuestion');
    return this.transloco.translate('logic.sentence', {
      question: this.source()?.title || untitled,
      operator: this.transloco.translate(`logic.operators.${rule.operator}`).toLowerCase(),
      value: rule.value || '—',
      action: this.transloco.translate(`logic.actions.${rule.action}`).toLowerCase(),
      target: this.questions().find((q) => q.id === rule.targetId)?.title || untitled,
    });
  }
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { ScaleSummary } from '../../core/data/types';

/** Média em destaque + distribuição em colunas — escala e número. */
@Component({
  selector: 'app-scale-distribution',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (scale().total === 0) {
        <p class="text-sm text-muted">{{ t('results.noAnswers') }}</p>
      } @else {
        <div>
          <div class="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div>
              <p class="text-xs text-muted">{{ averageLabel() || t('results.average') }}</p>
              <p class="text-title-sm font-bold text-heading">{{ scale().average }}</p>
            </div>
            <div>
              <p class="text-xs text-muted">{{ t('results.range') }}</p>
              <p class="text-lg font-semibold text-heading">{{ scale().min }} – {{ scale().max }}</p>
            </div>
            <div>
              <p class="text-xs text-muted">{{ t('results.answers') }}</p>
              <p class="text-lg font-semibold text-heading">{{ scale().total }}</p>
            </div>
          </div>

          <div class="mt-6 flex items-end gap-1.5 sm:gap-2.5" style="height: 140px">
            @for (step of scale().distribution; track step.label) {
              <div class="flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span class="text-[11px] tabular-nums text-muted">{{ step.value }}</span>
                <div
                  class="w-full rounded-t-md transition-all"
                  [style.height.%]="barHeight(step.value)"
                  [style.backgroundColor]="color()"
                  [style.opacity]="step.value === 0 ? 0.25 : 1"
                  [title]="step.label + ': ' + step.value + ' (' + step.percent + '%)'"
                ></div>
                <span class="w-full truncate text-center text-[11px] text-muted" [title]="step.label">
                  {{ step.label }}
                </span>
              </div>
            }
          </div>
        </div>
      }
    </ng-container>
  `,
})
export class ScaleDistributionComponent {
  readonly scale = input.required<ScaleSummary>();
  readonly color = input<string>('#465fff');
  /** Rótulo da média — "Média" na escala, "Valor médio" no número. */
  readonly averageLabel = input<string>('');

  readonly max = computed(() => Math.max(...this.scale().distribution.map((d) => d.value), 1));

  barHeight(value: number) {
    return Math.max(3, (value / this.max()) * 100);
  }
}

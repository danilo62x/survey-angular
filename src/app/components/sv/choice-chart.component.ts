import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { Slice } from '../../core/data/types';

const PALETTE = ['#465fff', '#12b76a', '#f79009', '#f04438', '#0ba5ec', '#7592ff', '#039855', '#dc6803'];

/** Barra para escolha única; barra empilhada para múltipla escolha. */
@Component({
  selector: 'app-choice-chart',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (total() === 0) {
        <p class="text-sm text-muted">{{ t('results.noAnswers') }}</p>
      } @else if (variant() === 'stacked') {
        <div>
          <div class="flex h-4 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            @for (slice of positive(); track slice.label) {
              <span
                [title]="slice.label + ': ' + slice.value"
                [style.width.%]="(slice.value / total()) * 100"
                [style.backgroundColor]="paletteAt(slice.index)"
              ></span>
            }
          </div>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            @for (slice of indexed(); track slice.label) {
              <li class="flex min-w-0 items-center gap-2 text-sm">
                <span class="h-2.5 w-2.5 shrink-0 rounded-full" [style.backgroundColor]="paletteAt(slice.index)"></span>
                <span class="min-w-0 flex-1 truncate text-body" [title]="slice.label">{{ slice.label }}</span>
                <span class="shrink-0 tabular-nums text-muted">{{ slice.value }} · {{ slice.percent }}%</span>
              </li>
            }
          </ul>
        </div>
      } @else {
        <ul class="flex flex-col gap-3">
          @for (slice of slices(); track slice.label) {
            <li class="min-w-0">
              <div class="flex items-baseline justify-between gap-3 text-sm">
                <span class="min-w-0 truncate text-body" [title]="slice.label">{{ slice.label }}</span>
                <span class="shrink-0 tabular-nums text-muted">{{ slice.value }} · {{ slice.percent }}%</span>
              </div>
              <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  class="h-full rounded-full"
                  [style.width.%]="(slice.value / max()) * 100"
                  [style.backgroundColor]="color()"
                ></div>
              </div>
            </li>
          }
        </ul>
      }
    </ng-container>
  `,
})
export class ChoiceChartComponent {
  readonly slices = input<Slice[]>([]);
  /** `stacked` desenha uma barra única com todas as opções — usado na múltipla escolha. */
  readonly variant = input<'bar' | 'stacked'>('bar');
  readonly color = input<string>('#465fff');

  readonly total = computed(() => this.slices().reduce((sum, s) => sum + s.value, 0));
  readonly max = computed(() => Math.max(...this.slices().map((s) => s.value), 1));
  readonly indexed = computed(() => this.slices().map((s, index) => ({ ...s, index })));
  // Como na referência React: as fatias da barra reindexam a partir das não vazias.
  readonly positive = computed(() =>
    this.slices()
      .filter((s) => s.value > 0)
      .map((s, index) => ({ ...s, index }))
  );

  paletteAt(index: number) {
    return PALETTE[index % PALETTE.length];
  }
}

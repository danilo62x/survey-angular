import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { MatrixSummary } from '../../core/data/types';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

/** Matriz de calor: quanto mais escuro, mais respostas naquela combinação. */
@Component({
  selector: 'app-matrix-heat',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (matrix().total === 0) {
        <p class="text-sm text-muted">{{ t('results.noAnswers') }}</p>
      } @else {
        <div class="-mx-1 overflow-x-auto px-1">
          <table class="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr>
                <th class="w-1/3 px-2 pb-2 text-left text-xs font-medium text-muted">{{ t('results.matrixRow') }}</th>
                @for (column of matrix().columns; track column) {
                  <th class="px-2 pb-2 text-center text-xs font-medium text-muted">{{ column }}</th>
                }
              </tr>
            </thead>
            <tbody>
              @for (row of matrix().rows; track row) {
                <tr>
                  <th scope="row" class="py-1.5 pr-3 text-left text-sm font-medium text-body">
                    <span class="block max-w-[14rem] truncate" [title]="row">{{ row }}</span>
                  </th>
                  @for (column of matrix().columns; track column) {
                    <td class="p-1">
                      <div
                        [class]="
                          'flex h-12 flex-col items-center justify-center rounded-lg text-xs font-semibold ' +
                          (strong(row, column) ? 'text-white' : 'text-body')
                        "
                        [style.backgroundColor]="cellColor(row, column)"
                        [title]="row + ' — ' + column + ': ' + count(row, column) + ' (' + percent(row, column) + '%)'"
                      >
                        <span>{{ count(row, column) }}</span>
                        <span
                          [class]="'text-[10px] font-normal ' + (strong(row, column) ? 'text-white/80' : 'text-muted')"
                        >
                          {{ percent(row, column) }}%
                        </span>
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </ng-container>
  `,
})
export class MatrixHeatComponent {
  readonly matrix = input.required<MatrixSummary>();
  readonly color = input<string>('#465fff');

  private rgb = computed(() => hexToRgb(this.color()));

  private cell(row: string, column: string) {
    return this.matrix().cells.find((c) => c.row === row && c.column === column);
  }

  count(row: string, column: string) {
    return this.cell(row, column)?.count ?? 0;
  }

  percent(row: string, column: string) {
    return this.cell(row, column)?.percent ?? 0;
  }

  private intensity(row: string, column: string) {
    const max = this.matrix().max;
    return max ? this.count(row, column) / max : 0;
  }

  strong(row: string, column: string) {
    return this.intensity(row, column) > 0.55;
  }

  cellColor(row: string, column: string) {
    const [r, g, b] = this.rgb();
    return `rgba(${r}, ${g}, ${b}, ${0.08 + this.intensity(row, column) * 0.85})`;
  }
}

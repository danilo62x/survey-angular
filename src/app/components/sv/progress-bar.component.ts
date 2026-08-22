import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';

/** Barra de progresso do formulário público — conta só as perguntas alcançáveis. */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *transloco="let t">
      <div class="mb-2 flex items-center justify-between text-xs text-muted">
        <span>{{ t('fill.step', { current: current, total: total }) }}</span>
        <span>{{ percent }}%</span>
      </div>
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        [attr.aria-valuenow]="percent"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          class="h-full rounded-full transition-[width] duration-300"
          [style.width.%]="barWidth()"
          [style.backgroundColor]="color"
        ></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  @Input() current = 0;
  @Input() total = 0;
  @Input() percent = 0;
  @Input() color = '#465fff';

  barWidth() {
    return Math.max(4, this.percent);
  }
}

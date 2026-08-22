import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { NpsBreakdown } from '../../core/data/types';

const RADIUS = 70;
const CIRCUMFERENCE = Math.PI * RADIUS;

function arc(value: number) {
  // O medidor vai de -100 a +100 em meia circunferência.
  const clamped = Math.max(-100, Math.min(100, value));
  return ((clamped + 100) / 200) * CIRCUMFERENCE;
}

/** Medidor de promotores, neutros e detratores — o NPS é calculado, nunca gravado. */
@Component({
  selector: 'app-nps-gauge',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center" *transloco="let t">
      <svg
        viewBox="0 0 180 104"
        [class]="size() === 'sm' ? 'w-40' : 'w-56'"
        role="img"
        [attr.aria-label]="t('results.nps')"
      >
        <path
          d="M20 92 A70 70 0 0 1 160 92"
          fill="none"
          stroke-width="14"
          stroke-linecap="round"
          class="stroke-gray-200 dark:stroke-gray-700"
        />
        <path
          d="M20 92 A70 70 0 0 1 160 92"
          fill="none"
          [attr.stroke]="tone()"
          stroke-width="14"
          stroke-linecap="round"
          [attr.stroke-dasharray]="dashArray()"
        />
        <text x="90" y="80" text-anchor="middle" class="fill-current text-heading" font-size="30" font-weight="700">
          {{ nps().score }}
        </text>
        <text x="90" y="98" text-anchor="middle" class="fill-current text-muted" font-size="11">
          {{ t('results.npsScore') }}
        </text>
      </svg>

      <div class="mt-3 grid w-full grid-cols-3 gap-2 text-center">
        <div class="rounded-lg bg-success-50 px-2 py-2 dark:bg-success-500/10">
          <p class="text-sm font-bold text-success-600">{{ pct(nps().promoters) }}%</p>
          <p class="text-[11px] text-muted">{{ t('results.promoters') }}</p>
        </div>
        <div class="rounded-lg bg-warning-50 px-2 py-2 dark:bg-warning-500/10">
          <p class="text-sm font-bold text-warning-600">{{ pct(nps().passives) }}%</p>
          <p class="text-[11px] text-muted">{{ t('results.passives') }}</p>
        </div>
        <div class="rounded-lg bg-error-50 px-2 py-2 dark:bg-error-500/10">
          <p class="text-sm font-bold text-error-600">{{ pct(nps().detractors) }}%</p>
          <p class="text-[11px] text-muted">{{ t('results.detractors') }}</p>
        </div>
      </div>

      <p class="mt-3 text-center text-xs text-muted">
        {{ t('results.npsFormula', { promoters: pct(nps().promoters), detractors: pct(nps().detractors) }) }}
      </p>
    </div>
  `,
})
export class NpsGaugeComponent {
  readonly nps = input.required<NpsBreakdown>();
  readonly size = input<'sm' | 'md'>('md');

  readonly tone = computed(() => {
    const score = this.nps().score;
    return score >= 50 ? '#12b76a' : score >= 0 ? '#f79009' : '#f04438';
  });

  readonly dashArray = computed(() => `${arc(this.nps().score)} ${CIRCUMFERENCE}`);

  pct(n: number) {
    const total = this.nps().total;
    return total ? Math.round((n / total) * 1000) / 10 : 0;
  }
}

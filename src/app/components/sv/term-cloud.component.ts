import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { TermCount } from '../../core/data/types';

/** Termos frequentes + amostras — o "gráfico" das perguntas de texto livre. */
@Component({
  selector: 'app-term-cloud',
  standalone: true,
  imports: [TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      @if (terms().length === 0 && samples().length === 0) {
        <p class="text-sm text-muted">{{ t('results.noAnswers') }}</p>
      } @else {
        <div>
          @if (terms().length > 0) {
            <p class="text-xs font-medium tracking-wide text-muted uppercase">{{ t('results.topTerms') }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (term of terms(); track term.term) {
                <span
                  class="inline-flex items-center gap-1.5 rounded-full border border-themed px-3 py-1"
                  [style.fontSize.px]="fontSize(term.count)"
                  [style.backgroundColor]="background(term.count)"
                >
                  <span class="text-body">{{ term.term }}</span>
                  <span class="text-xs tabular-nums text-muted">{{ term.count }}</span>
                </span>
              }
            </div>
          }

          @if (samples().length > 0) {
            <p class="mt-6 text-xs font-medium tracking-wide text-muted uppercase">{{ t('results.samples') }}</p>
            <ul class="mt-3 flex flex-col gap-2">
              @for (sample of samples(); track $index) {
                <li class="rounded-xl border border-themed px-4 py-3 text-sm break-words text-body">“{{ sample }}”</li>
              }
            </ul>
          }
        </div>
      }
    </ng-container>
  `,
})
export class TermCloudComponent {
  readonly terms = input<TermCount[]>([]);
  readonly samples = input<string[]>([]);

  readonly max = computed(() => Math.max(...this.terms().map((term) => term.count), 1));

  private weight(count: number) {
    return count / this.max();
  }

  fontSize(count: number) {
    return 12 + Math.round(this.weight(count) * 5);
  }

  background(count: number) {
    return `rgba(70, 95, 255, ${0.06 + this.weight(count) * 0.16})`;
  }
}

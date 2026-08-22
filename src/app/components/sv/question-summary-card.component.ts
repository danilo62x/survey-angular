import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import type { QuestionSummary } from '../../core/data/types';
import { IconComponent } from '../ui/icon-base.component';
import { QUESTION_ICON } from '../../lib/question-types';
import { usePlural } from '../../lib/i18n';
import { ChoiceChartComponent } from './choice-chart.component';
import { ScaleDistributionComponent } from './scale-distribution.component';
import { NpsGaugeComponent } from './nps-gauge.component';
import { MatrixHeatComponent } from './matrix-heat.component';
import { TermCloudComponent } from './term-cloud.component';

/** Um gráfico por tipo de pergunta — o resumo escolhe o recorte certo. */
@Component({
  selector: 'app-question-summary-card',
  standalone: true,
  imports: [
    TranslocoModule,
    IconComponent,
    ChoiceChartComponent,
    ScaleDistributionComponent,
    NpsGaugeComponent,
    MatrixHeatComponent,
    TermCloudComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="surface-card rounded-2xl border p-5 shadow-theme-sm md:p-6" *transloco="let t">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span
            class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
            [style.backgroundColor]="color()"
          >
            <app-icon [name]="typeIcon()" [size]="18" />
          </span>
          <div class="min-w-0">
            <p class="text-xs text-muted">
              {{ t('results.questionNumber', { index: index() + 1 }) }} ·
              {{ t('questionTypes.' + summary().question.type) }}
            </p>
            <h3 class="mt-0.5 text-base font-semibold break-words text-heading">
              {{ summary().question.title || t('builder.untitledQuestion') }}
            </h3>
          </div>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-sm font-semibold text-heading">{{ summary().answered }}</p>
          <p class="text-xs text-muted">
            @if (summary().skipped === 0) {
              {{ t('results.noSkips') }}
            } @else {
              {{ t(pl('results.skippedCount', summary().skipped), { count: summary().skipped }) }}
            }
          </p>
        </div>
      </div>

      <div class="mt-6">
        @switch (summary().kind) {
          @case ('escolha') {
            <app-choice-chart [slices]="summary().slices" [color]="color()" />
          }
          @case ('multipla') {
            <app-choice-chart [slices]="summary().slices" variant="stacked" [color]="color()" />
          }
          @case ('escala') {
            @if (summary().scale; as scale) {
              <app-scale-distribution [scale]="scale" [color]="color()" />
            }
          }
          @case ('numero') {
            @if (summary().scale; as scale) {
              <app-scale-distribution [scale]="scale" [color]="color()" [averageLabel]="t('results.averageValue')" />
            }
          }
          @case ('nps') {
            @if (summary().nps; as nps) {
              <app-nps-gauge [nps]="nps" />
            }
          }
          @case ('matriz') {
            @if (summary().matrix; as matrix) {
              <app-matrix-heat [matrix]="matrix" [color]="color()" />
            }
          }
          @case ('data') {
            <app-choice-chart [slices]="summary().slices" [color]="color()" />
          }
          @default {
            <app-term-cloud [terms]="summary().terms" [samples]="summary().samples" />
          }
        }
      </div>
    </section>
  `,
})
export class QuestionSummaryCardComponent {
  readonly summary = input.required<QuestionSummary>();
  readonly index = input.required<number>();
  readonly color = input<string>('#465fff');

  protected pl = usePlural();

  readonly typeIcon = computed(() => QUESTION_ICON[this.summary().question.type]);
}

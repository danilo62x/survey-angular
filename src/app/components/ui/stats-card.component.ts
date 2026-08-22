import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { IconComponent } from './icon-base.component';

type Accent = 'brand' | 'success' | 'warning' | 'error' | 'info';

const BG_MAP: Record<Accent, string> = {
  brand: 'bg-brand-50 dark:bg-brand-500/15',
  success: 'bg-success-50 dark:bg-success-500/15',
  warning: 'bg-warning-50 dark:bg-warning-500/15',
  error: 'bg-error-50 dark:bg-error-500/15',
  info: 'bg-blue-light-50 dark:bg-blue-light-500/15',
};

const COLOR_MAP: Record<Accent, string> = {
  brand: 'text-brand-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  error: 'text-error-500',
  info: 'text-blue-light-500',
};

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-2xl border border-themed bg-card-bg p-5 shadow-theme-sm surface-card md:p-6">
      <div [class]="'flex h-12 w-12 items-center justify-center rounded-xl ' + bgClass()">
        <app-icon [name]="icon" [size]="22" [class]="colorClass()" />
      </div>
      <div class="mt-5 flex items-end justify-between">
        <div>
          <span class="text-sm text-muted">{{ title }}</span>
          <h4 class="mt-2 font-bold text-heading text-title-sm">{{ value }}</h4>
        </div>
        @if (trend) {
          <span
            [class]="
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ' +
              (trend === 'up'
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500')
            "
          >
            <app-icon [name]="trend === 'up' ? 'arrow-up' : 'arrow-down'" [size]="12" [strokeWidth]="2.5" />
            {{ trendValue }}
          </span>
        }
      </div>
    </div>
  `,
})
export class StatsCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() icon = '';
  @Input() set accent(v: Accent) {
    this._accent.set(v);
  }
  private _accent = signal<Accent>('brand');
  @Input() trend?: 'up' | 'down';
  @Input() trendValue?: string;

  readonly bgClass = computed(() => BG_MAP[this._accent()]);
  readonly colorClass = computed(() => COLOR_MAP[this._accent()]);
}

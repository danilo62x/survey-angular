import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { IconComponent } from './icon-base.component';

type Color = 'brand' | 'success' | 'warning' | 'error' | 'gray';
type Variant = 'soft' | 'solid';

const SOFT: Record<Color, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
  success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
  warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
  error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
  gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const SOLID: Record<Color, string> = {
  brand: 'bg-brand-500 text-white',
  success: 'bg-success-500 text-white',
  warning: 'bg-warning-500 text-white',
  error: 'bg-error-500 text-white',
  gray: 'bg-gray-500 text-white',
};

const DOT: Record<Color, string> = {
  brand: 'bg-brand-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  gray: 'bg-gray-400',
};

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + styles()">
      @if (dot) {
        <span [class]="'h-1.5 w-1.5 rounded-full ' + (_variant() === 'solid' ? 'bg-white' : dotClass())"></span>
      }
      @if (icon) {
        <app-icon [name]="icon" [size]="12" [strokeWidth]="2.2" />
      }
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  @Input() set color(v: Color) {
    this._color.set(v);
  }
  private _color = signal<Color>('brand');
  @Input() set variant(v: Variant) {
    this._variant.set(v);
  }
  _variant = signal<Variant>('soft');
  @Input() icon?: string;
  @Input() dot = false;

  readonly styles = computed(() => (this._variant() === 'solid' ? SOLID[this._color()] : SOFT[this._color()]));
  readonly dotClass = computed(() => DOT[this._color()]);
}

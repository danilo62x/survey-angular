import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

type Variant = 'line' | 'circle' | 'rect';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div [class]="classes()" [style.width]="widthStyle()" [style.height]="heightStyle()"></div>`,
})
export class SkeletonComponent {
  @Input() set variant(v: Variant) {
    this._variant.set(v);
  }
  private _variant = signal<Variant>('line');
  @Input() width?: string | number;
  @Input() height?: string | number;
  @Input() class = '';

  readonly classes = computed(() => {
    const base = 'animate-pulse bg-gray-200 dark:bg-gray-700';
    const v = this._variant();
    const shape = v === 'circle' ? 'rounded-full' : v === 'rect' ? 'rounded-xl' : 'rounded-md';
    const defaults = v === 'circle' ? 'h-10 w-10' : v === 'rect' ? 'h-24 w-full' : 'h-3.5 w-full';
    const hasDims = this.width != null || this.height != null;
    return `${base} ${shape} ${hasDims ? '' : defaults} ${this.class}`;
  });

  readonly widthStyle = computed(() =>
    this.width != null ? (typeof this.width === 'number' ? `${this.width}px` : this.width) : null
  );
  readonly heightStyle = computed(() =>
    this.height != null ? (typeof this.height === 'number' ? `${this.height}px` : this.height) : null
  );
}

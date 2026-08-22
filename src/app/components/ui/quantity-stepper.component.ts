import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { IconComponent } from './icon-base.component';

@Component({
  selector: 'app-quantity-stepper',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex items-center rounded-lg border border-themed">
      <button
        type="button"
        (click)="dec()"
        [disabled]="value <= min"
        aria-label="-"
        [class]="dim() + ' flex items-center justify-center text-muted transition hover:text-heading disabled:opacity-40'"
      >
        <app-icon name="minus" [size]="16" />
      </button>
      <span [class]="'min-w-8 text-center text-sm font-medium text-heading ' + (sizeSig() === 'sm' ? '' : 'min-w-10')">
        {{ value }}
      </span>
      <button
        type="button"
        (click)="inc()"
        [disabled]="value >= max"
        aria-label="+"
        [class]="dim() + ' flex items-center justify-center text-muted transition hover:text-heading disabled:opacity-40'"
      >
        <app-icon name="plus" [size]="16" />
      </button>
    </div>
  `,
})
export class QuantityStepperComponent {
  @Input() value = 1;
  @Input() min = 1;
  @Input() max = 99;
  @Input() set size(v: 'sm' | 'md') {
    this.sizeSig.set(v);
  }
  protected sizeSig = signal<'sm' | 'md'>('md');
  @Output() changed = new EventEmitter<number>();

  readonly dim = computed(() => (this.sizeSig() === 'sm' ? 'h-8 w-8' : 'h-10 w-10'));

  dec() {
    this.changed.emit(Math.max(this.min, this.value - 1));
  }
  inc() {
    this.changed.emit(Math.min(this.max, this.value + 1));
  }
}

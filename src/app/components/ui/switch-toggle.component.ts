import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

@Component({
  selector: 'app-switch-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked"
      [disabled]="disabled"
      (click)="toggle()"
      [class]="
        'relative inline-flex shrink-0 items-center rounded-full transition ' +
        sizeClass() +
        ' ' +
        (checked ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700') +
        (disabled ? ' cursor-not-allowed opacity-50' : '')
      "
    >
      <span
        [class]="
          'inline-block transform rounded-full bg-white shadow-theme-xs transition ' +
          thumbSizeClass() +
          ' ' +
          (checked ? activeTranslate() : 'translate-x-1')
        "
      ></span>
    </button>
  `,
})
export class SwitchToggleComponent {
  @Input() checked = false;
  @Input() set size(v: 'sm' | 'md') {
    this._size.set(v);
  }
  private _size = signal<'sm' | 'md'>('md');
  @Input() disabled = false;
  @Output() changed = new EventEmitter<boolean>();

  readonly sizeClass = computed(() => (this._size() === 'sm' ? 'h-5 w-9' : 'h-6 w-11'));
  readonly thumbSizeClass = computed(() => (this._size() === 'sm' ? 'h-4 w-4' : 'h-5 w-5'));
  readonly activeTranslate = computed(() => (this._size() === 'sm' ? 'translate-x-4' : 'translate-x-5'));

  toggle() {
    if (!this.disabled) this.changed.emit(!this.checked);
  }
}

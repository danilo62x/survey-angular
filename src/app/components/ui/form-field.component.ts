import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

const baseControl =
  'focus-ring w-full rounded-lg border bg-transparent px-3.5 py-2.5 text-sm text-body placeholder:text-muted disabled:opacity-50';

/**
 * Reactive-Forms field wrapper mirroring the React FormikField styling.
 * Renders label, the chosen control (text/select/textarea) bound to a
 * FormControl, plus error/hint text. Select children are projected via
 * <ng-content>.
 */
@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-1.5">
      @if (label) {
        <label [attr.for]="id" class="block text-sm font-medium text-heading">{{ label }}</label>
      }

      @switch (control_type) {
        @case ('select') {
          <select [id]="id" [formControl]="control" [class]="fieldClasses()">
            <ng-content />
          </select>
        }
        @case ('textarea') {
          <textarea
            [id]="id"
            [formControl]="control"
            [rows]="rows"
            [placeholder]="placeholder"
            [class]="fieldClasses()"
          ></textarea>
        }
        @default {
          <input
            [id]="id"
            [type]="type"
            [min]="min"
            [formControl]="control"
            [placeholder]="placeholder"
            [class]="fieldClasses()"
          />
        }
      }

      @if (hasError()) {
        <p class="text-xs text-error-500">{{ errorText }}</p>
      } @else if (hint) {
        <p class="text-xs text-muted">{{ hint }}</p>
      }
    </div>
  `,
})
export class FormFieldComponent {
  @Input({ required: true }) control!: FormControl;
  @Input() label?: string;
  @Input() name = '';
  @Input() hint?: string;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input('control-type') control_type: 'input' | 'select' | 'textarea' = 'input';
  @Input() rows = 3;
  @Input() min?: number | string;
  /** Already-resolved error message to show when the control is invalid + touched. */
  @Input() errorText = '';

  get id() {
    return `f-${this.name}`;
  }

  hasError() {
    return this.control && this.control.invalid && (this.control.touched || this.control.dirty);
  }

  fieldClasses() {
    return `${baseControl} ${this.hasError() ? 'border-error-500' : 'border-themed'}`;
  }
}

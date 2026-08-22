import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from './icon-base.component';

export interface TabItem {
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-1 overflow-x-auto border-b border-themed no-scrollbar" role="tablist">
      @for (t of tabs; track t.label; let i = $index) {
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="value === i"
          (click)="onChange.emit(i)"
          [class]="
            '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ' +
            (value === i
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-muted hover:border-gray-300 hover:text-body dark:hover:border-gray-700')
          "
        >
          @if (t.icon) { <app-icon [name]="t.icon" [size]="16" /> }
          {{ t.label }}
        </button>
      }
    </div>
    <div class="pt-5 text-sm text-body" role="tabpanel">
      <ng-content />
    </div>
  `,
})
export class TabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() value = 0;
  @Output() onChange = new EventEmitter<number>();
}

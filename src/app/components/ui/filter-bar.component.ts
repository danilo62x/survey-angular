import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from './icon-base.component';

/** Toolbar with a search input plus arbitrary filter controls (selects, etc.). */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="surface-card mb-5 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center">
      @if (searchable) {
        <div class="relative w-full lg:max-w-xs">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <app-icon name="search" [size]="16" />
          </span>
          <input
            [ngModel]="search"
            (ngModelChange)="searchChange.emit($event)"
            [placeholder]="searchPlaceholder"
            class="focus-ring w-full rounded-lg border border-themed bg-transparent py-2 pr-3 pl-9 text-sm text-body"
          />
        </div>
      }
      <div class="flex flex-wrap items-center gap-3"><ng-content /></div>
      <div class="lg:ml-auto"><ng-content select="[filterAction]" /></div>
    </div>
  `,
})
export class FilterBarComponent {
  @Input() search = '';
  @Input() searchable = true;
  @Input() searchPlaceholder = '';
  @Output() searchChange = new EventEmitter<string>();
}

import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IconComponent } from './icon-base.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
        <app-icon [name]="icon" [size]="28" />
      </span>
      <h3 class="mt-5 text-lg font-semibold text-heading">{{ title }}</h3>
      @if (description) { <p class="mt-2 max-w-sm text-sm text-muted">{{ description }}</p> }
      <div class="mt-6"><ng-content /></div>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'package';
  @Input() title = '';
  @Input() description?: string;
}

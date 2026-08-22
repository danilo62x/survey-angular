import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BreadcrumbComponent, Crumb } from '../ui/breadcrumb.component';

/** App page heading with optional breadcrumb + right-aligned action slot. */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [BreadcrumbComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        @if (crumbs && crumbs.length > 0) {
          <div class="mb-2"><app-breadcrumb [items]="crumbs" /></div>
        }
        <h1 class="text-2xl font-bold text-heading">{{ title }}</h1>
        @if (subtitle) {
          <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
        }
      </div>
      @if (hasAction) {
        <div class="shrink-0"><ng-content /></div>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() crumbs?: Crumb[];
  @Input() hasAction = true;
}

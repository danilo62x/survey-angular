import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icon-base.component';

export interface Crumb {
  label: string;
  href?: string;
  icon?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      <ol class="flex flex-wrap items-center gap-1.5 text-sm">
        @for (item of items; track item.label; let i = $index) {
          <li class="flex items-center gap-1.5">
            @if (item.href && i !== items.length - 1) {
              <a
                [routerLink]="item.href"
                class="inline-flex items-center gap-1.5 text-muted transition hover:text-brand-600 dark:hover:text-brand-400"
              >
                @if (item.icon) { <app-icon [name]="item.icon" [size]="15" /> }
                {{ item.label }}
              </a>
            } @else {
              <span
                [attr.aria-current]="i === items.length - 1 ? 'page' : null"
                [class]="'inline-flex items-center gap-1.5 ' + (i === items.length - 1 ? 'font-medium text-heading' : 'text-muted')"
              >
                @if (item.icon) { <app-icon [name]="item.icon" [size]="15" /> }
                {{ item.label }}
              </span>
            }
            @if (i !== items.length - 1) {
              <app-icon name="chevron-right" [size]="14" class="text-gray-400" />
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  @Input() items: Crumb[] = [];
}

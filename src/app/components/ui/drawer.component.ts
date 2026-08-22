import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { IconComponent } from './icon-base.component';

/** Right-side sliding drawer (e.g. client ficha, item picker). */
@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="'fixed inset-0 z-[70] ' + (open ? '' : 'pointer-events-none')" [attr.aria-hidden]="!open">
      <div
        [class]="'absolute inset-0 bg-gray-900/50 transition-opacity ' + (open ? 'opacity-100' : 'opacity-0')"
        (click)="closed.emit()"
      ></div>
      <aside
        [class]="
          'surface-card absolute right-0 top-0 flex h-full w-full ' + width +
          ' flex-col border-l shadow-theme-xl transition-transform duration-300 ' +
          (open ? 'translate-x-0' : 'translate-x-full')
        "
        role="dialog"
        [attr.aria-label]="title"
      >
        <div class="flex items-start justify-between border-b border-themed px-5 py-4">
          <div>
            @if (title) { <h2 class="text-lg font-semibold text-heading">{{ title }}</h2> }
            @if (subtitle) { <p class="mt-0.5 text-xs text-muted">{{ subtitle }}</p> }
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-heading"
            aria-label="Fechar"
          >
            <app-icon name="x" [size]="20" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-5 py-4"><ng-content /></div>
        @if (hasFooter) {
          <div class="border-t border-themed px-5 py-4"><ng-content select="[drawerFooter]" /></div>
        }
      </aside>
    </div>
  `,
})
export class DrawerComponent {
  @Input() open = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() width = 'max-w-md';
  @Input() hasFooter = false;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.closed.emit();
  }
}

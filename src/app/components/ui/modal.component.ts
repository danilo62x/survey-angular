import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { IconComponent } from './icon-base.component';

type Size = 'sm' | 'md' | 'lg' | 'xl';
const SIZE_MAP: Record<Size, string> = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-[80] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm"
        (click)="onBackdrop($event)"
      >
        <div [class]="'surface-card relative w-full overflow-hidden rounded-2xl border shadow-theme-xl ' + sizeClass()">
          @if (title || subtitle || closable) {
            <header class="flex items-center justify-between border-b border-themed px-5 py-4">
              <div>
                @if (title) { <h3 class="text-base font-semibold text-heading">{{ title }}</h3> }
                @if (subtitle) { <p class="mt-0.5 text-xs text-muted">{{ subtitle }}</p> }
              </div>
              @if (closable) {
                <button
                  type="button"
                  aria-label="Fechar"
                  (click)="closed.emit()"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <app-icon name="x" [size]="20" />
                </button>
              }
            </header>
          }
          <div class="px-5 py-5"><ng-content /></div>
          @if (hasFooter) {
            <footer class="flex items-center justify-end gap-2 border-t border-themed px-5 py-3">
              <ng-content select="[modalFooter]" />
            </footer>
          }
        </div>
      </div>
    }
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() set size(v: Size) {
    this._size.set(v);
  }
  private _size = signal<Size>('md');
  @Input() closable = true;
  @Input() hasFooter = false;
  @Output() closed = new EventEmitter<void>();

  readonly sizeClass = computed(() => SIZE_MAP[this._size()]);

  onBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open) this.closed.emit();
  }
}

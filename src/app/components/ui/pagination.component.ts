import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { IconComponent } from './icon-base.component';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (totalPages > 1) {
      <nav class="flex items-center justify-center gap-2" aria-label="Pagination">
        <button
          type="button"
          (click)="onChange.emit(page - 1)"
          [disabled]="page <= 1"
          [class]="btn + ' text-muted hover:text-heading'"
          aria-label="Previous"
        >
          <app-icon name="chevron-left" [size]="16" />
        </button>
        @for (p of pages(); track $index) {
          @if (p === '...') {
            <span class="px-1 text-muted">…</span>
          } @else {
            <button
              type="button"
              (click)="onChange.emit($any(p))"
              [class]="btn + ' ' + (p === page ? 'border-brand-500 bg-brand-500 text-white' : 'text-body hover:text-heading')"
            >
              {{ p }}
            </button>
          }
        }
        <button
          type="button"
          (click)="onChange.emit(page + 1)"
          [disabled]="page >= totalPages"
          [class]="btn + ' text-muted hover:text-heading'"
          aria-label="Next"
        >
          <app-icon name="chevron-right" [size]="16" />
        </button>
      </nav>
    }
  `,
})
export class PaginationComponent {
  @Input() set page(v: number) {
    this._page.set(v);
  }
  get page() {
    return this._page();
  }
  private _page = signal(1);

  @Input() set totalPages(v: number) {
    this._total.set(v);
  }
  get totalPages() {
    return this._total();
  }
  private _total = signal(1);

  @Output() onChange = new EventEmitter<number>();

  protected btn =
    'flex h-10 min-w-10 items-center justify-center rounded-lg border border-themed px-3 text-sm font-medium transition disabled:opacity-40';

  readonly pages = computed<(number | '...')[]>(() => {
    const page = this._page();
    const totalPages = this._total();
    const out: (number | '...')[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        out.push(i);
      } else if (out[out.length - 1] !== '...') {
        out.push('...');
      }
    }
    return out;
  });
}

import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Status = 'online' | 'offline' | 'busy';

const SIZE_MAP: Record<Size, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-16 w-16 text-lg',
};

const STATUS_SIZE: Record<Size, string> = {
  xs: 'h-2 w-2',
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
  xl: 'h-4 w-4',
};

const STATUS_COLOR: Record<Status, string> = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  busy: 'bg-error-500',
};

function initials(name?: string) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="relative inline-flex shrink-0">
      @if (src) {
        <img [src]="src" [alt]="name ?? ''" [class]="'rounded-full object-cover ' + sizeClass()" />
      } @else {
        <span [class]="'flex items-center justify-center rounded-full bg-brand-500 font-bold text-white ' + sizeClass()">
          {{ initialsText() }}
        </span>
      }
      @if (status) {
        <span
          [class]="'absolute bottom-0 right-0 rounded-full border-2 ' + statusSizeClass() + ' ' + statusColorClass()"
          style="border-color: var(--tx-card-bg)"
        ></span>
      }
    </span>
  `,
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() set name(v: string | undefined) {
    this._name.set(v);
  }
  get name() {
    return this._name();
  }
  private _name = signal<string | undefined>(undefined);

  @Input() set size(v: Size) {
    this._size.set(v);
  }
  private _size = signal<Size>('md');
  @Input() status?: Status;

  readonly sizeClass = computed(() => SIZE_MAP[this._size()]);
  readonly statusSizeClass = computed(() => STATUS_SIZE[this._size()]);
  readonly statusColorClass = computed(() => (this.status ? STATUS_COLOR[this.status] : ''));
  readonly initialsText = computed(() => initials(this._name()));
}

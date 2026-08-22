import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { IconComponent } from './icon-base.component';
import { LANGUAGES } from '@app/core/transloco-loader';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-base hover:bg-gray-50 dark:hover:bg-gray-800"
        (click)="open.set(!open())"
        aria-label="Language"
        [title]="current().label"
      >
        <span aria-hidden="true">{{ current().flag }}</span>
      </button>
      @if (open()) {
        <div class="surface-card absolute right-0 mt-3 w-44 rounded-xl border py-1 shadow-theme-lg">
          @for (lang of languages; track lang.code) {
            <button
              type="button"
              (click)="select(lang.code)"
              [class]="
                'flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ' +
                (lang.code === current().code ? 'font-medium text-brand-600' : 'text-body')
              "
            >
              <span aria-hidden="true">{{ lang.flag }}</span>
              {{ lang.label }}
              @if (lang.code === current().code) { <app-icon name="check" [size]="14" class="ml-auto" /> }
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class LanguageSwitcherComponent {
  private transloco = inject(TranslocoService);
  private host = inject(ElementRef<HTMLElement>);
  readonly languages = LANGUAGES;
  readonly open = signal(false);
  private active = signal(this.transloco.getActiveLang());

  readonly current = computed(() => this.languages.find((l) => l.code === this.active()) ?? this.languages[0]);

  constructor() {
    this.transloco.langChanges$.subscribe((l) => this.active.set(l));
  }

  select(code: string) {
    this.transloco.setActiveLang(code);
    try {
      localStorage.setItem('lang', code);
    } catch {}
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}

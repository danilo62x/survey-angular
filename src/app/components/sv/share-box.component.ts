import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import type { Survey } from '../../core/data/types';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../ui/icon-base.component';
import { QrCodeComponent } from './qr-code.component';

/** Link público, código de leitura e trecho para incorporar. */
@Component({
  selector: 'app-share-box',
  standalone: true,
  imports: [TranslocoModule, IconComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-5 lg:grid-cols-3" *transloco="let t">
      <div [class]="box + ' lg:col-span-2'">
        <h3 class="text-base font-semibold text-heading">{{ t('share.linkTitle') }}</h3>
        <p class="mt-1 text-sm text-muted">{{ t('share.linkDesc') }}</p>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readonly
            [value]="link()"
            [attr.aria-label]="t('share.linkTitle')"
            class="focus-ring min-w-0 flex-1 rounded-lg border border-themed bg-gray-50 px-3.5 py-2.5 text-sm text-body dark:bg-gray-900/40"
          />
          <button
            type="button"
            (click)="copy(link(), 'link')"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <app-icon [name]="copied() === 'link' ? 'check' : 'copy'" [size]="16" />
            {{ copied() === 'link' ? t('share.copiedShort') : t('common.copy') }}
          </button>
        </div>

        <h3 class="mt-8 text-base font-semibold text-heading">{{ t('share.embedTitle') }}</h3>
        <p class="mt-1 text-sm text-muted">{{ t('share.embedDesc') }}</p>
        <textarea
          readonly
          rows="3"
          [value]="embed()"
          [attr.aria-label]="t('share.embedTitle')"
          class="focus-ring mt-4 w-full resize-none rounded-lg border border-themed bg-gray-50 px-3.5 py-2.5 font-mono text-xs text-body dark:bg-gray-900/40"
        ></textarea>
        <button
          type="button"
          (click)="copy(embed(), 'embed')"
          class="mt-3 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <app-icon [name]="copied() === 'embed' ? 'check' : 'code'" [size]="16" />
          {{ copied() === 'embed' ? t('share.copiedShort') : t('share.copyEmbed') }}
        </button>
      </div>

      <div [class]="box + ' flex flex-col items-center text-center'">
        <h3 class="text-base font-semibold text-heading">{{ t('share.qrTitle') }}</h3>
        <p class="mt-1 text-sm text-muted">{{ t('share.qrDesc') }}</p>
        <div class="mt-5">
          <app-qr-code [value]="link()" />
        </div>
        <a
          [href]="link()"
          target="_blank"
          rel="noreferrer"
          class="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <app-icon name="external-link" [size]="16" />
          {{ t('share.openForm') }}
        </a>
      </div>
    </div>
  `,
})
export class ShareBoxComponent {
  readonly survey = input.required<Survey>();

  private ui = inject(UiService);
  private transloco = inject(TranslocoService);

  protected box = 'surface-card rounded-2xl border p-5 md:p-6';
  readonly copied = signal<string | null>(null);

  private origin = typeof window !== 'undefined' ? window.location.origin : 'https://sondagem.app';

  readonly link = computed(() => `${this.origin}/f/${this.survey().slug}`);
  readonly embed = computed(
    () =>
      `<iframe src="${this.link()}" width="100%" height="640" frameborder="0" title="${this.survey().title}"></iframe>`
  );

  async copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Navegador sem permissão de área de transferência: seguimos com o aviso.
    }
    this.copied.set(key);
    this.ui.notifySuccess(this.transloco.translate('share.copied'));
    setTimeout(() => this.copied.set(null), 2000);
  }
}

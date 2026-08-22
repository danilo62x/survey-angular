import { DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';

const BASE = 'Sondagem — Pesquisas & Formulários';

/**
 * Sets the document title to "<translated titleKey> · <base>" and keeps it in
 * sync with the active language. Call from a component constructor / injection
 * context. Pass no key to use just the base title.
 */
export function usePageTitle(titleKey?: string) {
  const transloco = inject(TranslocoService);
  const destroyRef = inject(DestroyRef);

  if (!titleKey) {
    document.title = BASE;
    return;
  }

  // selectTranslate espera o JSON do idioma carregar e reemite a cada troca de
  // idioma — translate() puro devolveria a própria chave no primeiro render.
  transloco
    .selectTranslate(titleKey)
    .pipe(takeUntilDestroyed(destroyRef))
    .subscribe((title) => {
      document.title = title ? `${title} · ${BASE}` : BASE;
    });
}

/** Sets a literal (already-resolved) title string. */
export function setLiteralTitle(title: string) {
  document.title = title ? `${title} · ${BASE}` : BASE;
}

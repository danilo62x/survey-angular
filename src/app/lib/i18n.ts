import { inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

/**
 * Resolve a chave de plural no formato dos arquivos de tradução
 * (`base_one` / `base_other`), usando as mesmas regras de plural do CLDR que o
 * i18next aplica na referência React. Só existem as categorias `one` e `other`
 * nos três idiomas, então qualquer outra categoria cai em `other`.
 */
export function pluralKey(base: string, count: number, lang: string): string {
  let category = 'other';
  try {
    category = new Intl.PluralRules(lang).select(count);
  } catch {
    category = count === 1 ? 'one' : 'other';
  }
  return `${base}_${category === 'one' ? 'one' : 'other'}`;
}

/**
 * Helper para usar em campos de componente (contexto de injeção):
 * `protected pl = usePlural();` → `t(pl('results.skippedCount', n), { count: n })`.
 */
export function usePlural(): (base: string, count: number) => string {
  const transloco = inject(TranslocoService);
  return (base: string, count: number) => pluralKey(base, count, transloco.getActiveLang());
}

/** Idioma ativo, para os helpers de `Intl` em `lib/format.ts`. */
export function useLang(): () => string {
  const transloco = inject(TranslocoService);
  return () => transloco.getActiveLang();
}

import { ApplicationConfig, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@jsverse/transloco';
import { routes } from './app.routes';
import { HttpTranslocoLoader } from './core/transloco-loader';

const SUPPORTED_LANGS = ['pt-BR', 'en', 'es'];

/**
 * Mesma ordem de detecção da referência React (`localStorage` → `navigator`,
 * chave `lang`, queda para pt-BR) e o idioma detectado já fica persistido.
 */
function detectLang(): string {
  try {
    const stored = localStorage.getItem('lang');
    if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  } catch {}

  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of candidates) {
    if (!raw) continue;
    if (SUPPORTED_LANGS.includes(raw)) return raw;
    const base = raw.split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  return 'pt-BR';
}

const initialLang = detectLang();

try {
  localStorage.setItem('lang', initialLang);
} catch {}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' })
    ),
    provideAnimations(),
    provideHttpClient(),
    provideTransloco({
      config: {
        availableLangs: ['pt-BR', 'en', 'es'],
        defaultLang: initialLang,
        fallbackLang: 'pt-BR',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: HttpTranslocoLoader,
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

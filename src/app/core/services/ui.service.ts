import { Injectable, effect, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

const STORAGE_KEY = 'sv-ui';

interface Persisted {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  cookiesAccepted: boolean;
  /** Avisar a cada resposta recebida — usado nas configurações. */
  notifyOnResponse: boolean;
}

function load(): Persisted {
  const fallback: Persisted = {
    darkMode: false,
    sidebarCollapsed: false,
    cookiesAccepted: false,
    notifyOnResponse: true,
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: Partial<Persisted> } & Partial<Persisted>;
      const s = parsed.state ?? parsed;
      return { ...fallback, ...s };
    }
  } catch {}
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class UiService {
  private toastId = 0;
  private initial = load();

  readonly darkMode = signal(this.initial.darkMode);
  readonly sidebarCollapsed = signal(this.initial.sidebarCollapsed);
  readonly sidebarMobileOpen = signal(false);
  readonly toasts = signal<Toast[]>([]);
  readonly cookiesAccepted = signal(this.initial.cookiesAccepted);
  readonly showCookieBanner = signal(false);
  readonly notifyOnResponse = signal(this.initial.notifyOnResponse);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            darkMode: this.darkMode(),
            sidebarCollapsed: this.sidebarCollapsed(),
            cookiesAccepted: this.cookiesAccepted(),
            notifyOnResponse: this.notifyOnResponse(),
          })
        );
      } catch {}
    });
    this.applyTheme();
  }

  toggleDarkMode() {
    this.darkMode.update((v) => !v);
    this.applyTheme();
  }

  setDarkMode(val: boolean) {
    this.darkMode.set(val);
    this.applyTheme();
  }

  applyTheme() {
    const root = document.documentElement;
    if (this.darkMode()) root.classList.add('dark');
    else root.classList.remove('dark');
  }

  toggleSidebar() {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleSidebarMobile(val?: boolean) {
    this.sidebarMobileOpen.set(val !== undefined ? val : !this.sidebarMobileOpen());
  }

  notify(message: string, type: ToastType = 'info', duration = 4000) {
    const id = ++this.toastId;
    this.toasts.update((arr) => [...arr, { id, message, type, duration }]);
    setTimeout(() => this.dismissToast(id), duration);
  }

  notifySuccess(message: string) {
    this.notify(message, 'success');
  }
  notifyError(message: string) {
    this.notify(message, 'error');
  }
  notifyWarning(message: string) {
    this.notify(message, 'warning');
  }

  dismissToast(id: number) {
    this.toasts.update((arr) => arr.filter((t) => t.id !== id));
  }

  acceptCookies() {
    this.cookiesAccepted.set(true);
    this.showCookieBanner.set(false);
  }

  declineCookies() {
    this.cookiesAccepted.set(false);
    this.showCookieBanner.set(false);
  }

  openCookieBanner() {
    this.showCookieBanner.set(true);
  }

  closeCookieBanner() {
    this.showCookieBanner.set(false);
  }

  setNotifyOnResponse(val: boolean) {
    this.notifyOnResponse.set(val);
  }
}

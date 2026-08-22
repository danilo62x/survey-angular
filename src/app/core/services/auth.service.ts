import { Injectable, computed, effect, signal } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

/** Conta sugerida na tela de login. Qualquer e-mail/senha entra. */
export const DEMO_CREDENTIALS = { email: 'pesquisa@sondagem.com', password: 'demo123' };

const STORAGE_KEY = 'sv-auth';

function loadPersisted(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { user?: User | null }; user?: User | null };
      return parsed.state?.user ?? parsed.user ?? null;
    }
  } catch {}
  return null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(loadPersisted());
  readonly isAuthenticated = computed(() => this.user() !== null);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: this.user() }));
      } catch {}
    });
  }

  // Autenticação fictícia: qualquer e-mail/senha não vazios entram.
  async login(email: string, password: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 500));
    if (!email || !password) return false;
    const isDemo = email === DEMO_CREDENTIALS.email;
    const raw = email.split('@')[0].replace(/[._-]/g, ' ') || 'Pesquisa';
    const name = isDemo ? 'Helena Prado' : raw.charAt(0).toUpperCase() + raw.slice(1);
    this.user.set({
      id: 1,
      name,
      email,
      role: 'Coordenadora de pesquisa',
      organization: 'Sondagem',
    });
    return true;
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 500));
    if (!name || !email || !password) return false;
    this.user.set({ id: 1, name, email, role: 'Analista de pesquisa', organization: '' });
    return true;
  }

  logout() {
    this.user.set(null);
  }

  updateProfile(patch: Partial<User>) {
    const user = this.user();
    if (!user) return;
    this.user.set({ ...user, ...patch });
  }
}

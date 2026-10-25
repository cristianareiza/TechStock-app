export class TokenStorage {
  private readonly key: string;

  constructor(key = 'techstock.token') {
    this.key = key;
  }

  get(): string | null {
    try {
      return localStorage.getItem(this.key);
    } catch {
      return null;
    }
  }

  set(token: string): void {
    try {
      localStorage.setItem(this.key, token);
    } catch {
      // en modo privado puede fallar
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key);
    } catch {
      // no pasa nada
    }
  }
}

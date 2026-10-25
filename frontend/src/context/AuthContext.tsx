import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '../models/User';
import { authService, httpClient } from '../services';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    authService.hasSession() ? 'checking' : 'anonymous',
  );

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setStatus('anonymous');
  }, []);

  // si el token vence se cierra la sesión
  useEffect(() => {
    httpClient.onUnauthorized(logout);
  }, [logout]);

  // recuperar la sesión al recargar
  useEffect(() => {
    if (!authService.hasSession()) return;
    let cancelled = false;
    authService
      .getCurrentUser()
      .then((current) => {
        if (cancelled) return;
        setUser(current);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelled) logout();
      });
    return () => {
      cancelled = true;
    };
  }, [logout]);

  const login = useCallback(async (email: string, password: string) => {
    const loggedIn = await authService.login(email, password);
    setUser(loggedIn);
    setStatus('authenticated');
    return loggedIn;
  }, []);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}

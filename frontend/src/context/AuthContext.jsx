// src/context/AuthContext.jsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

/**
 * Role → default landing path after login.
 * Keep in sync with the protected routes we add in the next pieces.
 */
export const ROLE_HOME = {
  client: '/client',
  administrator: '/admin',
  staff: '/staff',
  finance_officer: '/finance',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until first bootstrap finishes

  /**
   * On mount: try refresh cookie → new access token → /me.
   * If anything fails we stay logged out (no error thrown to UI).
   */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        await api.refresh();
        const me = await api.getMe();
        if (!cancelled) setUser(me);
      } catch {
        api.clearAccessToken();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (emailOrUsername, password) => {
    const data = await api.login(emailOrUsername, password);
    // login response already includes user; fall back to /me if needed
    const nextUser = data.user ?? (await api.getMe());
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      roleType: user?.roleType ?? null,
    }),
    [user, loading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
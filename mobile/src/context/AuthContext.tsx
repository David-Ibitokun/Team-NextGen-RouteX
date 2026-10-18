import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, initializeApiSession } from '../services/apiClient';

export interface RouteXUser {
  id: number | string;
  username: string;
  email: string;
  display_name: string;
  role: 'admin' | 'moderator' | 'citizen';
  date_joined?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface AuthContextValue {
  user: RouteXUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isCitizen: boolean;
  login: (username: string, password: string) => Promise<RouteXUser>;
  register: (payload: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }) => Promise<RouteXUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<RouteXUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      // First check cached user for quick UI hydration
      const cached = await authService.getSavedUser();
      if (cached && !user) {
        setUser(cached);
      }

      // Then verify with backend /auth/me/
      const fresh = await authService.getMe();
      setUser(fresh);
    } catch {
      // If unauthenticated or offline, fallback to cached user or null
      const cached = await authService.getSavedUser();
      setUser(cached || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApiSession().then(() => {
      fetchCurrentUser();
    });
  }, [fetchCurrentUser]);

  const login = async (username: string, password: string): Promise<RouteXUser> => {
    const data = await authService.login({ username, password });
    setUser(data);
    return data;
  };

  const register = async (payload: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    display_name?: string;
  }): Promise<RouteXUser> => {
    const data = await authService.register(payload);
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && (user.is_superuser || user.role === 'admin'));
  const isModerator = Boolean(
    user && (user.is_superuser || user.is_staff || user.role === 'moderator' || user.role === 'admin')
  );
  const isCitizen = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isModerator,
        isCitizen,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        refreshMe: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

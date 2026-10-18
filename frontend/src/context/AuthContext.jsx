import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/apiClient";

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  isModerator: false,
  isAdmin: false,
  isCitizen: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  deleteAccount: async () => {},
  refreshUser: async () => {},
  refreshMe: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUser(data);
    } catch (err) {
      // Unauthenticated session - expected for guests
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (username, password) => {
    const data = await authService.login({ username, password });
    setUser(data);
    return data;
  };

  const register = async (payload) => {
    const data = await authService.register(payload);
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout network errors and clear client state
    } finally {
      setUser(null);
    }
  };

  const deleteAccount = async () => {
    await authService.deleteAccount();
    setUser(null);
  };

  const isAuthenticated = Boolean(user);
  const isAdmin = Boolean(user && (user.is_superuser || user.role === "admin"));
  const isModerator = Boolean(
    user && (user.is_superuser || user.is_staff || user.role === "moderator" || user.role === "admin")
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
        deleteAccount,
        refreshUser: fetchCurrentUser,
        refreshMe: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;

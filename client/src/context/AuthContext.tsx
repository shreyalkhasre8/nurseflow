import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUserByEmail: (email: string) => Promise<void>;
  hasRole: (roles: RoleName[]) => boolean;
  isNurse: boolean;
  isSupervisor: boolean;
  isInventoryManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nurseflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem('nurseflow_token');
      if (storedToken) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch (err) {
          console.error('Failed to validate session token:', err);
          localStorage.removeItem('nurseflow_token');
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    loadUser();

    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('nurseflow:session_expired', handleSessionExpired);
    return () => window.removeEventListener('nurseflow:session_expired', handleSessionExpired);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login(username, password);
      localStorage.setItem('nurseflow_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUserByEmail = async (email: string) => {
    // Quick demo role switcher login using standard credentials
    await login(email, 'hospital123');
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('nurseflow_token');
      setUser(null);
      setToken(null);
    }
  };

  const hasRole = (roles: RoleName[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isNurse = user?.role === 'Nurse';
  const isSupervisor = user?.role === 'Head Nurse / Supervisor';
  const isInventoryManager = user?.role === 'Inventory Manager';
  const isAdmin = user?.role === 'Administrator';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUserByEmail,
        hasRole,
        isNurse,
        isSupervisor,
        isInventoryManager,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

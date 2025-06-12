import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { JWTPayload, Tenant } from '@shared/schema';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  } | null;
  tenant: {
    id: number;
    name: string;
    subdomain: string;
    modules: string[];
  } | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasModule: (moduleName: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tenant: null,
    token: null,
  });

  // Load token from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('auth_user');
    const tenantData = localStorage.getItem('auth_tenant');

    if (token && userData && tenantData) {
      try {
        const user = JSON.parse(userData);
        const tenant = JSON.parse(tenantData);
        
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user,
          tenant,
          token,
        });
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_tenant');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store auth data
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    localStorage.setItem('auth_tenant', JSON.stringify(data.tenant));

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user: data.user,
      tenant: data.tenant,
      token: data.token,
    });
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_tenant');
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tenant: null,
      token: null,
    });
  };

  const hasModule = (moduleName: string): boolean => {
    return authState.tenant?.modules.includes(moduleName) || false;
  };

  const hasRole = (roles: string[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        ...authState,
        login,
        logout,
        hasModule,
        hasRole,
      }
    },
    children
  );
};
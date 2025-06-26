import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { JWTPayload, Tenant } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';


interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: JWTPayload | null;
  tenant: Tenant | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasModule: (module: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);



  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          tenant: data.tenant,
        });

      } else {
        localStorage.removeItem('authToken');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Inloggning misslyckades');
      }

      const data = await response.json();
      localStorage.setItem('authToken', data.token);
      
      // Invalidate all cached queries to ensure fresh data with new user context
      queryClient.clear();
      
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user: data.user,
        tenant: data.tenant,
      });

      // Show system announcement after successful login
      setTimeout(async () => {
        try {
          const response = await fetch('/api/system/announcements/active', {
            headers: {
              'Authorization': `Bearer ${data.token}`,
            },
          });
          
          if (response.ok) {
            const announcement = await response.json();
            if (announcement && announcement.message) {
              // Create a simple toast notification
              const toastElement = document.createElement('div');
              toastElement.innerHTML = `
                <div style="
                  position: fixed;
                  top: 20px;
                  right: 20px;
                  z-index: 9999;
                  background: #1e40af;
                  color: white;
                  padding: 16px;
                  border-radius: 8px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                  max-width: 400px;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                ">
                  <div style="font-weight: 600; margin-bottom: 4px;">Systemmeddelande</div>
                  <div>${announcement.message}</div>
                  <button onclick="this.parentElement.parentElement.remove()" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                  ">&times;</button>
                </div>
              `;
              document.body.appendChild(toastElement);
              
              // Auto-remove after 8 seconds
              setTimeout(() => {
                if (toastElement.parentElement) {
                  toastElement.remove();
                }
              }, 8000);
            }
          }
        } catch (error) {
          console.error('Error fetching system announcement:', error);
        }
      }, 1000); // Wait 1 second after login
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tenant: null,
    });
  };

  const hasModule = (module: string): boolean => {
    // Superadmin has access to all modules
    if (authState.user?.role === 'superadmin') {
      return true;
    }
    return authState.tenant ? authState.tenant.modules.includes(module) : false;
  };

  const hasRole = (roles: string[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    hasModule,
    hasRole,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};
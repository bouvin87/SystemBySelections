import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User, Building2, Settings, Languages, Check, Switch } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export default function UserMenu() {
  const { user, tenant, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { i18n, t } = useTranslation();
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  const fetchAvailableTenants = async () => {
    if (!user?.email) return;
    
    setLoadingTenants(true);
    try {
      const response = await fetch('/api/auth/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableTenants(data.tenants || []);
      }
    } catch (error) {
      console.error('Failed to fetch tenants:', error);
    } finally {
      setLoadingTenants(false);
    }
  };

  const switchTenant = async (tenantId: number) => {
    try {
      const response = await apiRequest({
        endpoint: '/api/auth/switch-tenant',
        method: 'POST',
        data: { tenantId },
      });

      if (response.token) {
        localStorage.setItem('authToken', response.token);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchAvailableTenants();
    }
  }, [user?.email]);

  if (!user || !tenant) {
    return null;
  }

  const initials = (user as any).firstName && (user as any).lastName 
    ? `${(user as any).firstName.charAt(0)}${(user as any).lastName.charAt(0)}`.toUpperCase()
    : user.email.charAt(0).toUpperCase();

  const displayName = (user as any).firstName && (user as any).lastName 
    ? `${(user as any).firstName} ${(user as any).lastName}`
    : user.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Building2 className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span className="text-sm">{tenant.name}</span>
            <span className="text-xs text-muted-foreground">
              Tenant ID: {tenant.id}
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <User className="mr-2 h-4 w-4" />
          <span className="text-sm capitalize">{user.role}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Languages className="mr-2 h-4 w-4" />
            <span>Språk</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => changeLanguage('sv')}>
              <div className="flex items-center">
                {i18n.language === 'sv' && <Check className="mr-2 h-4 w-4" />}
                <span className={i18n.language !== 'sv' ? 'ml-6' : ''}>Svenska</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')}>
              <div className="flex items-center">
                {i18n.language === 'en' && <Check className="mr-2 h-4 w-4" />}
                <span className={i18n.language !== 'en' ? 'ml-6' : ''}>English</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        {user.role === 'admin' && (
          <>
            <DropdownMenuItem onClick={() => setLocation('/admin')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Administration</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem 
          onClick={logout}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logga ut</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
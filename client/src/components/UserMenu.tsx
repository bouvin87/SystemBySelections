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
import { LogOut, User, Building2, Settings, Languages, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

export default function UserMenu() {
  const { user, tenant, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { i18n } = useTranslation();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
  };

  if (!user) {
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
        <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-blue-700 md:h-8 md:w-8">
          <Avatar className="h-9 w-9 md:h-8 md:w-8">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 md:w-56" align="end" forceMount sideOffset={8} avoidCollisions={true}>
        <DropdownMenuLabel className="font-normal p-4 md:p-3">
          <div className="flex flex-col space-y-2 md:space-y-1">
            <p className="text-base md:text-sm font-medium leading-none">{displayName}</p>
            <p className="text-sm md:text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {tenant && (
          <DropdownMenuItem disabled className="p-3 md:p-2">
            <Building2 className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4 text-blue-600" />
            <span className="text-base md:text-sm font-medium">{tenant.name}</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem disabled className="p-3 md:p-2">
          <User className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4 text-green-600" />
          <span className="text-base md:text-sm capitalize font-medium">
            {user.role === 'superadmin' ? 'Super Admin' : 
             user.role === 'admin' ? 'Administrator' : 'Användare'}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="p-3 md:p-2">
            <Languages className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4" />
            <span className="text-base md:text-sm">Språk</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem onClick={() => changeLanguage('sv')} className="p-3 md:p-2">
              <div className="flex items-center">
                {i18n.language === 'sv' && <Check className="mr-2 h-4 w-4 text-green-600" />}
                <span className={`text-base md:text-sm ${i18n.language !== 'sv' ? 'ml-6' : ''}`}>Svenska</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('en')} className="p-3 md:p-2">
              <div className="flex items-center">
                {i18n.language === 'en' && <Check className="mr-2 h-4 w-4 text-green-600" />}
                <span className={`text-base md:text-sm ${i18n.language !== 'en' ? 'ml-6' : ''}`}>English</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        <DropdownMenuSeparator />
        
        {user.role === 'admin' && (
          <DropdownMenuItem onClick={() => setLocation('/admin')} className="p-3 md:p-2">
            <Settings className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4 text-gray-600" />
            <span className="text-base md:text-sm">Administration</span>
          </DropdownMenuItem>
        )}
        
        {user.role === 'superadmin' && (
          <DropdownMenuItem onClick={() => setLocation('/super-admin')} className="p-3 md:p-2">
            <Crown className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4 text-yellow-600" />
            <span className="text-base md:text-sm">Super Admin</span>
          </DropdownMenuItem>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={logout}
          className="text-red-600 focus:text-red-600 p-3 md:p-2"
        >
          <LogOut className="mr-3 md:mr-2 h-5 w-5 md:h-4 md:w-4" />
          <span className="text-base md:text-sm font-medium">Logga ut</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
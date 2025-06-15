import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Building2,
  Shield,
  Sparkles,
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function ModernNavigation() {
  const { user, tenant, logout, hasModule, hasRole } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      current: location === '/',
      badge: null
    },
    ...(hasModule('checklists') ? [{
      name: 'Checklistor',
      href: '/checklists',
      icon: ClipboardList,
      current: location === '/checklists',
      badge: '3'
    }] : []),
    ...(hasRole(['admin', 'superadmin']) ? [{
      name: 'Administration',
      href: '/admin',
      icon: Settings,
      current: location === '/admin',
      badge: null
    }] : []),
    ...(hasRole(['superadmin']) ? [{
      name: 'Super Admin',
      href: '/superadmin',
      icon: Shield,
      current: location === '/superadmin',
      badge: 'PRO'
    }] : []),
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="modern-card bg-white/90 backdrop-blur-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Modern Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-r border-gray-200/50 transform transition-all duration-500 ease-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 md:static md:inset-0 shadow-xl`}>
        
        {/* Gradient Header */}
        <div className="gradient-bg h-20 flex items-center justify-between px-6 relative overflow-hidden">
          <div className="flex items-center space-x-3 z-10">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                {tenant?.name || 'SuperAdmin Panel'}
              </h1>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-white/80 capitalize font-medium">{user.role}</span>
                {user.role === 'superadmin' && (
                  <Sparkles className="h-3 w-3 text-yellow-300" />
                )}
              </div>
            </div>
          </div>
          
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 relative"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button>
          
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        </div>

        {/* Search Bar */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Sök..." 
              className="pl-10 bg-gray-50/50 border-gray-200/50 focus:bg-white transition-all duration-300"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 pb-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <a
                    className={`group flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 modern-button animated-border ${
                      item.current
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 h-5 w-5 transition-transform duration-300 ${
                        item.current ? 'scale-110' : 'group-hover:scale-105'
                      }`} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        item.current 
                          ? 'bg-white/20 text-white' 
                          : 'bg-primary/10 text-primary'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Modern User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="modern-card p-4 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold text-white">
                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300 modern-button"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
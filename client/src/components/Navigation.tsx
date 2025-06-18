import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClipboardList,
  Menu,
  X,
  CheckSquare,
  Plus,
  User,
  Building2,
  Settings,
  Crown,
  LogOut,
  Languages,
  Check,
  ChevronDown,
  ChevronUp,
  Building,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";
import FormModal from "@/components/FormModal";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import UserMenu from "@/components/UserMenu";
import { renderIcon } from "@/lib/icon-utils";
import { useAuth } from "@/hooks/useAuth";
import LanguageSelector from "@/components/LanguageSelector";

// Mobile User Section Component - embedded directly in mobile menu
function MobileUserSection({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const authData = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  }).data;

  const tenant = authData?.tenant;

  const displayName =
    (user as any).firstName && (user as any).lastName
      ? `${(user as any).firstName} ${(user as any).lastName}`
      : user.email;

  const initials = displayName
    .split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="space-y-3">
      {/* User info card - modern design */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">{initials}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-base">{displayName}</p>
            <p className="text-blue-200 text-sm">{user.email}</p>
          </div>
        </div>

        {/* User details */}
        <div className="space-y-2 text-sm">
          {tenant && (
            <div className="flex items-center gap-2 text-blue-100">
              <Building2 className="h-4 w-4" />
              <span>{tenant.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-blue-100">
            <User className="h-4 w-4" />
            <span className="capitalize">
              {user.role === "superadmin"
                ? "Super Admin"
                : user.role === "admin"
                  ? "Administrator"
                  : "Användare"}
            </span>
          </div>
        </div>
      </div>

      {/* Language selection - modern */}
      <div className="bg-gray-50 rounded-lg p-3">
        <LanguageSelector />
      </div>

      {/* Admin links */}
      {user.role === "admin" && (
        <button
          onClick={() => {
            setLocation("/admin");
            onClose();
          }}
          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
        >
          <Settings className="mr-3 h-5 w-5" />
          Administration
        </button>
      )}

      {user.role === "superadmin" && (
        <button
          onClick={() => {
            setLocation("/super-admin");
            onClose();
          }}
          className="flex items-center w-full px-3 py-3 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
        >
          <Crown className="mr-3 h-5 w-5" />
          Super Admin
        </button>
      )}

      {/* Logout button */}
      <button
        onClick={() => {
          logout();
          onClose();
        }}
        className="flex items-center w-full px-3 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md font-medium"
      >
        <LogOut className="mr-3 h-5 w-5" />
        Logga ut
      </button>
    </div>
  );
}

export default function Navigation() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(
    null,
  );

  // Fetch user data to check module access
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check if user has access to checklists module
  const hasChecklistsModule =
    authData?.tenant?.modules?.includes("checklists") ?? false;

  // Fetch checklistor that should be shown in menu (only if user has access)
  const { data: menuChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active", "menu"],
    enabled: hasChecklistsModule,
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const result = await fetch("/api/checklists/active", { headers });
      if (!result.ok) {
        throw new Error(`Failed to fetch active checklists: ${result.status}`);
      }
      const activeChecklists = await result.json();
      return activeChecklists.filter(
        (checklist: Checklist) => checklist.showInMenu,
      );
    },
  });

  const navItems = [{ href: "/dashboard", label: "Dashboard" }];

  const openModal = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleChecklistSelection = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setModalOpen(true);
    setChecklistSelectionOpen(false);
  };

  return (
    <>
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first header - modern design */}
          <div className="flex justify-between items-center h-16 px-6">
            <Link
              href="/"
              className="flex items-center text-gray-900 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Building className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold">ProductionLog</h1>
            </Link>

            <div className="flex items-center gap-3">
              {/* Desktop-only navigation - modern style */}
              <div className="hidden lg:flex items-center space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {menuChecklists.map((checklist) => (
                  <button
                    key={`checklist-${checklist.id}`}
                    onClick={() => openModal(checklist.id)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-2 transition-colors"
                  >
                    {renderIcon(checklist.icon, "h-4 w-4") || (
                      <CheckSquare className="h-4 w-4" />
                    )}
                    {checklist.name}
                  </button>
                ))}

                {hasChecklistsModule && (
                  <button
                    onClick={() => setChecklistSelectionOpen(true)}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t("navigation.startNewChecklist")}
                  </button>
                )}
              </div>

              {/* User menu - always visible on desktop */}
              <div className="hidden lg:flex items-center space-x-4">
                <LanguageSelector />
                <UserMenu />
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 transition-colors rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu - modern design */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 bg-white">
              <div className="px-6 py-4 space-y-4">
                {/* Navigation items */}
                <div className="space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location === item.href
                          ? "text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* Mobile checklist buttons */}
                  {menuChecklists.map((checklist) => (
                    <button
                      key={`mobile-checklist-${checklist.id}`}
                      onClick={() => openModal(checklist.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md gap-2 transition-colors"
                    >
                      {renderIcon(checklist.icon, "h-4 w-4") || (
                        <CheckSquare className="h-4 w-4" />
                      )}
                      {checklist.name}
                    </button>
                  ))}

                  {hasChecklistsModule && (
                    <button
                      onClick={() => setChecklistSelectionOpen(true)}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md gap-2 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      {t("navigation.startNewChecklist")}
                    </button>
                  )}
                </div>

                {/* Mobile user section */}
                <div className="border-t border-gray-100 pt-4">
                  <MobileUserSection onClose={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {modalOpen && selectedChecklistId && (
        <FormModal
          checklistId={selectedChecklistId}
          onClose={() => {
            setModalOpen(false);
            setSelectedChecklistId(null);
          }}
        />
      )}

      {checklistSelectionOpen && (
        <ChecklistSelectionModal
          onClose={() => setChecklistSelectionOpen(false)}
          onSelect={handleChecklistSelection}
        />
      )}
    </>
  );
}

export { Navigation };
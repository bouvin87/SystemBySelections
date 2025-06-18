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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";
import FormModal from "@/components/FormModal";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import UserMenu from "@/components/UserMenu";
import { renderIcon } from "@/lib/icon-utils";
import { useAuth } from "@/hooks/useAuth";

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
      {/* User info card */}
      <div className="bg-blue-700 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
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

      {/* Action buttons */}
      <div className="space-y-2">
        {/* Language selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2 text-blue-300 text-sm">
            <Languages className="h-4 w-4" />
            <span>Språk</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => changeLanguage("sv")}
              className={`flex items-center justify-start w-full px-3 py-2 text-sm rounded-md transition-colors ${
                i18n.language === "sv"
                  ? "bg-blue-600 text-white"
                  : "text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50"
              }`}
            >
              {i18n.language === "sv" && <Check className="mr-2 h-4 w-4" />}
              Svenska
            </button>
            <button
              onClick={() => changeLanguage("en")}
              className={`flex items-center justify-start w-full px-3 py-2 text-sm rounded-md transition-colors ${
                i18n.language === "en"
                  ? "bg-blue-600 text-white"
                  : "text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50"
              }`}
            >
              {i18n.language === "en" && <Check className="mr-2 h-4 w-4" />}
              English
            </button>
          </div>
        </div>

        {/* Admin links */}
        {user.role === "admin" && (
          <button
            onClick={() => {
              setLocation("/admin");
              onClose();
            }}
            className="flex items-center w-full px-3 py-3 text-base text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-md"
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
            className="flex items-center w-full px-3 py-3 text-base text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-md"
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
          className="flex items-center w-full px-3 py-3 text-base text-blue-200 hover:text-white hover:bg-[var(--color-warning)]/80 transition-colors rounded-md font-medium"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logga ut
        </button>
      </div>
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
  const [accountSectionExpanded, setAccountSectionExpanded] = useState(false);

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
      <nav className="bg-blue-700 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first header */}
          <div className="flex justify-between items-center h-16 px-4">
            <Link
              href="/"
              className="flex items-center text-white hover:text-blue-200 transition-colors"
            >
              <ClipboardList className="h-6 w-6 mr-2" />
              <h1 className="text-lg font-semibold">ProduktionsLogg</h1>
            </Link>

            <div className="flex items-center gap-3">
              {/* Desktop-only navigation */}
              <div className="hidden lg:flex items-center gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href
                        ? "bg-blue-700 text-white"
                        : "text-blue-100 hover:text-white hover:bg-blue-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {menuChecklists.map((checklist) => (
                  <button
                    key={`checklist-${checklist.id}`}
                    onClick={() => openModal(checklist.id)}
                    className="px-3 py-2 text-sm text-blue-100 hover:text-white hover:bg-blue-600 rounded-md flex items-center gap-2 transition-colors"
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
                    className="px-3 py-2 text-sm text-blue-100 hover:text-white hover:bg-blue-600 rounded-md flex items-center gap-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    {t("navigation.startNewChecklist")}
                  </button>
                )}
              </div>

              {/* User menu - always visible */}
              <div className="hidden lg:block">
                <UserMenu />
              </div>

              {/* Mobile menu button */}
              <button
                className="lg:hidden p-2 text-blue-100 hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-md"
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

          {/* Mobile slide-down menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t bg-blue-600 border-blue-600">
              <div className="px-4 py-3 space-y-1">
                {/* Navigation links */}
                <div className="space-y-1 mb-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`block px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                        location === item.href
                          ? "bg-blue-600 text-white"
                          : "hover:bg-[var(--color-accent)]/50"
                      }`}
                      style={{
                        color: location === item.href ? 'white' : 'var(--color-link)'
                      } as React.CSSProperties}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Checklist buttons */}
                {(menuChecklists.length > 0 || hasChecklistsModule) && (
                  <div className="space-y-2 mb-4">
                    <div className="px-3 py-1 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                      {t("navigation.checklists")}
                    </div>

                    {menuChecklists.map((checklist) => (
                      <button
                        key={`mobile-checklist-${checklist.id}`}
                        onClick={() => openModal(checklist.id)}
                        className="w-full flex items-center justify-start px-3 py-3 text-base text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-lg gap-3"
                      >
                        {renderIcon(checklist.icon, "h-5 w-5") || (
                          <CheckSquare className="h-5 w-5" />
                        )}
                        {checklist.name}
                      </button>
                    ))}

                    {hasChecklistsModule && (
                      <button
                        onClick={() => {
                          setChecklistSelectionOpen(true);
                          setMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-start px-3 py-3 text-base text-blue-200 hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-lg gap-3"
                      >
                        <Plus className="h-5 w-5" />
                        {t("navigation.startNewChecklist")}
                      </button>
                    )}
                  </div>
                )}

                {/* User section - embedded directly in mobile menu */}
                <div className="border-t border-gray-400 pt-4">
                  <button
                    onClick={() => setAccountSectionExpanded(!accountSectionExpanded)}
                    className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-blue-300 uppercase tracking-wider hover:text-white hover:bg-[var(--color-accent)]/50 transition-colors rounded-md"
                  >
                    <span>Konto</span>
                    {accountSectionExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {accountSectionExpanded && (
                    <div className="block lg:hidden space-y-2 mt-2">
                      <MobileUserSection
                        onClose={() => setMobileMenuOpen(false)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* FormModal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedChecklistId={selectedChecklistId || undefined}
      />

      {/* Checklist Selection Modal */}
      <ChecklistSelectionModal
        isOpen={checklistSelectionOpen}
        onClose={() => setChecklistSelectionOpen(false)}
        onSelectChecklist={handleChecklistSelection}
      />
    </>
  );
}

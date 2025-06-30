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
  HelpCircle,
  AlertTriangle,
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
import QuickAccess from "@/components/QuickAccess";
import logoSvg from "@/lib/logo.svg?url";

// Mobile User Section Component - embedded directly in mobile menu with collapsible functionality
function MobileUserSection({
  onClose,
  accountSectionExpanded,
  setAccountSectionExpanded,
}: {
  onClose: () => void;
  accountSectionExpanded: boolean;
  setAccountSectionExpanded: (expanded: boolean) => void;
}) {
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const authData = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  }).data;

  const tenant = authData?.tenant || { name: 'System by Selection' };

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
      {/* Collapsible User Account Section */}
      <div className="bg-gray-50 rounded-lg overflow-hidden">
        <button
          onClick={() => setAccountSectionExpanded(!accountSectionExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium text-blue-700">
                {initials}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {displayName}
              </div>
              <div className="text-xs text-gray-500">{user.email}</div>
            </div>
          </div>
          {accountSectionExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Expanded account section */}
        {accountSectionExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-200">
            {/* User details */}
            <div className="pt-3 space-y-2 text-sm">
              {tenant && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{tenant.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
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

            {/* Language selection */}
            <div className="pt-2">
              <LanguageSelector />
            </div>

            {/* FAQ link */}
            <button
              onClick={() => {
                setLocation("/faq");
                onClose();
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
            >
              <HelpCircle className="mr-3 h-4 w-4" />
              Vanliga frågor
            </button>

            {/* Admin links */}
            {user.role === "admin" && (
              <button
                onClick={() => {
                  setLocation("/admin");
                  onClose();
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
              >
                <Settings className="mr-3 h-4 w-4" />
                Administration
              </button>
            )}

            {user.role === "superadmin" && (
              <button
                onClick={() => {
                  setLocation("/super-admin");
                  onClose();
                }}
                className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-md"
              >
                <Crown className="mr-3 h-4 w-4" />
                Super Admin
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors rounded-md font-medium"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Logga ut
            </button>
          </div>
        )}
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

  // Build navigation items based on user access
  const navItems = [
    { href: "/", label: "Hem" },
    ...(hasChecklistsModule ? [{ href: "/checklists", label: "Checklistor" }] : []),
    ...(authData?.tenant?.modules?.includes('deviations') ? [{ href: "/deviations", label: "Avvikelser" }] : []),
  ];

  const openModal = (checklistId: number) => {
    console.log("Opening modal for checklist:", checklistId);
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
      <nav className="bg-white border-b border-gray-100  top-0 z-50">
        <div className="max-w-7xl mx-auto">
          {/* Mobile-first header - modern design */}
          <div className="flex items-center h-16 px-6">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center text-gray-900 hover:text-blue-600 transition-colors"
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-1 p-0">
                <img
                  src={logoSvg}
                  alt={t("common.applicationName")}
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-lg font-semibold">
                {t("common.applicationName")}
              </h1>
            </Link>

            {/* Desktop navigation - left side after logo */}
            <div className="hidden lg:flex items-stretch space-x-1 ml-8 h-16">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 flex items-center text-sm font-medium transition-all duration-200 border-b-2 ${
                    location === item.href
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </Link>
              ))}



              {hasChecklistsModule && (
                <button
                  onClick={() => {
                    console.log("Opening checklist selection modal");
                    setChecklistSelectionOpen(true);
                  }}
                  className="px-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-all duration-200 border-b-2 border-transparent hover:border-gray-300"
                >
                  <Plus className="h-4 w-4" />
                  {t("navigation.startNewChecklist")}
                </button>
              )}
            </div>

            {/* Right side - User menu and mobile button */}
            <div className="flex items-center gap-3 ml-auto">
              {/* User menu - always visible on desktop */}
              <div className="hidden lg:flex items-center space-x-3">
                {/* FAQ icon */}
                <Link
                  href="/faq"
                  className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Vanliga frågor"
                >
                  <HelpCircle className="h-5 w-5" />
                </Link>
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
                  <MobileUserSection
                    onClose={() => setMobileMenuOpen(false)}
                    accountSectionExpanded={accountSectionExpanded}
                    setAccountSectionExpanded={setAccountSectionExpanded}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Modals */}
      {modalOpen && selectedChecklistId && (
        <FormModal
          isOpen={modalOpen}
          preselectedChecklistId={selectedChecklistId}
          onClose={() => {
            setModalOpen(false);
            setSelectedChecklistId(null);
          }}
        />
      )}

      {checklistSelectionOpen && (
        <ChecklistSelectionModal
          isOpen={checklistSelectionOpen}
          onClose={() => setChecklistSelectionOpen(false)}
          onSelectChecklist={handleChecklistSelection}
        />
      )}
      
      {/* Quick Access Menu */}
      <QuickAccess onChecklistSelect={openModal} />
    </>
  );
}

export { Navigation };

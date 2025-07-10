import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";
import QuickAccess from "@/components/QuickAccess";
import FormModal from "@/components/FormModal";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import {
  Menu,
  X,
  HelpCircle,
  User,
  Building2,
  LogOut,
  ChevronDown,
  ChevronUp,
  Settings,
  Crown,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import logoSvg from "@/lib/logo.svg?url";
import { AnimatePresence, motion } from "framer-motion";
import LanguageSelector from "@/components/LanguageSelector";

export default function Navigation() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userSectionOpen, setUserSectionOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(
    null,
  );
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);

  const openModal = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setModalOpen(true);
  };

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  const hasChecklistsModule =
    authData?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule =
    authData?.tenant?.modules?.includes("deviations") ?? false;
  const tenant = authData?.tenant || { name: "System" };
  const hasKanbanModule =
    authData?.tenant?.modules?.includes("kanban") ?? false;
  const { firstName, lastName, email, role } = user || {};
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : email;
  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { href: "/", label: "Hem" },
    ...(hasChecklistsModule
      ? [{ href: "/checklists", label: "Checklistor" }]
      : []),
    ...(hasDeviationsModule
      ? [{ href: "/deviations", label: "Avvikelser" }]
      : []),
    ...(hasKanbanModule ? [{ href: "/kanban", label: "Kanban" }] : []),
  ];

  return (
    <>
      <nav className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <img src={logoSvg} alt="Logo" className="h-8 w-8" />
                <span className="text-lg font-semibold text-foreground">
                  {t("common.applicationName")}
                </span>
              </Link>

              <div className="hidden lg:flex gap-4 ml-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium tracking-wide px-3 pb-2 border-b-2 transition-colors duration-300 ease-in-out ${
                      location === item.href
                        ? "text-primary border-primary"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:border-primary"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Link
                href="/faq"
                className="hidden lg:flex items-center justify-center w-9 h-9 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
              >
                <HelpCircle className="h-5 w-5" />
              </Link>
              <div className="hidden lg:block">
                <UserMenu />
              </div>
              <button
                className="lg:hidden text-muted-foreground hover:text-foreground transition-colors"
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
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden bg-background shadow-md"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      location === item.href
                        ? "bg-muted text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* User Section Collapsable */}
                <div className="mt-4 border-t border-border pt-4">
                  <button
                    onClick={() => setUserSectionOpen(!userSectionOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {initials}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-foreground">
                          {displayName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {email}
                        </div>
                      </div>
                    </div>
                    {userSectionOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {userSectionOpen && (
                    <div className="mt-3 space-y-2 px-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{tenant.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="capitalize">
                          {role === "superadmin"
                            ? "Super Admin"
                            : role === "admin"
                              ? "Administrator"
                              : "Användare"}
                        </span>
                      </div>
                      <LanguageSelector />
                      {role === "admin" && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Settings className="h-4 w-4" /> Administration
                        </Link>
                      )}
                      {role === "superadmin" && (
                        <Link
                          href="/super-admin"
                          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Crown className="h-4 w-4" /> Super Admin
                        </Link>
                      )}
                      <button
                        onClick={() => logout()}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-md"
                      >
                        <LogOut className="h-4 w-4" /> Logga ut
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <QuickAccess
        onChecklistSelect={openModal}
        setChecklistSelectionOpen={setChecklistSelectionOpen}
      />

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
          onSelectChecklist={openModal}
        />
      )}
    </>
  );
}

export { Navigation };

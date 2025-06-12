import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ClipboardList, Menu, X, CheckSquare, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";
import FormModal from "@/components/FormModal";
import ChecklistSelectionModal from "@/components/ChecklistSelectionModal";
import UserMenu from "@/components/UserMenu";
import { renderIcon } from "@/lib/icon-utils";

export default function Navigation() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  // Fetch user data to check module access
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Check if user has access to checklists module
  const hasChecklistsModule = authData?.tenant?.modules?.includes('checklists') ?? false;

  // Fetch checklistor that should be shown in menu (only if user has access)
  const { data: menuChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active", "menu"],
    enabled: hasChecklistsModule,
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const result = await fetch("/api/checklists/active", { headers });
      if (!result.ok) {
        throw new Error(`Failed to fetch active checklists: ${result.status}`);
      }
      const activeChecklists = await result.json();
      return activeChecklists.filter((checklist: Checklist) => checklist.showInMenu);
    },
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    ...(hasChecklistsModule ? [{ href: "/admin", label: "Admin" }] : []),
  ];

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
      <nav className="bg-primary text-white material-shadow-2 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center text-white hover:text-blue-200 transition-colors">
            <ClipboardList className="text-2xl mr-3" />
            <h1 className="text-xl font-medium">ProduktionsLogg</h1>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`hover:text-blue-200 transition-colors px-3 py-2 rounded ${
                  location === item.href ? "bg-blue-700" : ""
                }`}
              >
                {item.label}
              </Link>
            ))}
            {menuChecklists.map((checklist) => (
              <Button
                key={`checklist-${checklist.id}`}
                onClick={() => openModal(checklist.id)}
                className="hover:text-blue-200 transition-colors px-3 py-2 rounded flex items-center bg-green-600 hover:bg-green-700 text-white"
                variant="ghost"
              >
                {renderIcon(checklist.icon, "mr-2 h-4 w-4") || <CheckSquare className="mr-2 h-4 w-4" />}
                {checklist.name}
              </Button>
            ))}
            
            {/* Checklist Selection Button - only show if user has checklists module */}
            {hasChecklistsModule && (
              <Button
                onClick={() => setChecklistSelectionOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded flex items-center"
                variant="ghost"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('navigation.startNewChecklist')}
              </Button>
            )}
            
            {/* User Menu */}
            <UserMenu />
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden p-2 hover:bg-blue-700 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-blue-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md hover:bg-blue-600 transition-colors ${
                  location === item.href ? "bg-blue-600" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {menuChecklists.map((checklist) => (
              <Button
                key={`mobile-checklist-${checklist.id}`}
                onClick={() => openModal(checklist.id)}
                className="block px-3 py-2 rounded-md hover:bg-green-700 transition-colors bg-green-600 flex items-center text-white w-full justify-start"
                variant="ghost"
              >
                {renderIcon(checklist.icon, "mr-2 h-4 w-4") || <CheckSquare className="mr-2 h-4 w-4" />}
                {checklist.name}
              </Button>
            ))}
            
            {/* Mobile Checklist Selection Button - only show if user has checklists module */}
            {hasChecklistsModule && (
              <Button
                onClick={() => {
                  setChecklistSelectionOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="block px-3 py-2 rounded-md hover:bg-orange-700 transition-colors bg-orange-600 flex items-center text-white w-full justify-start"
                variant="ghost"
              >
                <Plus className="mr-2 h-4 w-4" />
                {t('navigation.startNewChecklist')}
              </Button>
            )}
          </div>
        </div>
      )}
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

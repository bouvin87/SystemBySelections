import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ClipboardList, Menu, X, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Checklist } from "@shared/schema";
import FormModal from "@/components/FormModal";
import { renderIcon } from "@/lib/icon-utils";

export default function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);

  // Fetch checklistor that should be shown in menu
  const { data: menuChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active", "menu"],
    queryFn: async () => {
      const result = await fetch("/api/checklists/active");
      const activeChecklists = await result.json();
      return activeChecklists.filter((checklist: Checklist) => checklist.showInMenu);
    },
  });

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Administration" },
  ];

  const openModal = (checklistId: number) => {
    setSelectedChecklistId(checklistId);
    setModalOpen(true);
    setMobileMenuOpen(false);
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
          <div className="hidden md:flex space-x-6">
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
    </>
  );
}

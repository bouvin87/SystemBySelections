import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus, Home, MoreHorizontal, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderIcon } from "@/lib/icon-utils";
import DeviationModal from "@/components/DeviationModal";
import type { Checklist } from "@shared/schema";
import clsx from "clsx"; // eller classnames
import IconActionButton from "./ui/actionbutton";
import { useLocation } from "wouter";
import ChecklistSelectionModal from "./ChecklistSelectionModal";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
  setChecklistSelectionOpen: (val: boolean) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Check if user has access to checklists module
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const hasChecklistsModule = (authData as any)?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule = (authData as any)?.tenant?.modules?.includes("deviations") ?? false;

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

  // Fetch deviation settings to check if create button should be shown
  const { data: deviationSettings } = useQuery({
    queryKey: ["/api/deviations/settings"],
    enabled: hasDeviationsModule,
  });

  // Don't render if no access to any modules or no items to show
  const hasChecklistItems = hasChecklistsModule && menuChecklists.length > 0;
  const hasDeviationButton = hasDeviationsModule && deviationSettings?.showCreateButtonInMenu;
  // Always show navigation bar with standard buttons
  const allButtons = [

  ];
  // Add deviation button if available
  if (hasDeviationButton) {
    allButtons.push({
      id: 'deviations',
      icon: <Plus className="h-6 w-6" />,
      label: "Avvikelse",
      onClick: () => setIsDeviationModalOpen(true),

    });
  }
  // Add checklist button if user has access and there are checklists
  if (hasChecklistItems && menuChecklists.length > 0) {
    allButtons.push({
      id: 'checklists',
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Checklistor",
      onClick: () => {
        setChecklistSelectionOpen(true);
      },

    });
  }
  // ➕ Lägg till separator
  

  // Add first checklist as quick access if available
  if (hasChecklistItems && menuChecklists.length > 0) {
    allButtons.push({ id: 'divider' }); // specialtyp
    menuChecklists.forEach((checklist) => {
      allButtons.push({
        id: `checklist-${checklist.id}`,
        icon: renderIcon(checklist.icon, "h-6 w-6") || <CheckSquare className="h-6 w-6" />,
        label: checklist.name,
        onClick: () => onChecklistSelect(checklist.id),
        active: false
      });
    });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 modern-nav safe-area-inset-bottom z-10">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex justify-around items-center">
          {allButtons.map((button) => {
            if (button.id === 'divider') {
              return (
                <div
                  key="divider"
                  className="h-8 w-px bg-gray-300 mx-2 opacity-50"
                />
              );
            }

            return (
              <button
                key={button.id}
                onClick={button.onClick}
                className={`flex flex-col items-center justify-center py-2 px-2 modern-button min-w-[50px] ${
                  button.active 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`mb-1 ${button.active ? 'scale-110' : ''}`}>
                  {button.icon}
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {button.label}
                </span>
                {button.active && (
                  <div className="mt-1 w-4 h-0.5 bg-primary rounded-full"></div>
                )}
              </button>
            );
          })}

        </div>
      </div>

      {/* Deviation Modal */}
      <DeviationModal 
        isOpen={isDeviationModalOpen} 
        onClose={() => setIsDeviationModalOpen(false)}
      />
      {checklistSelectionOpen && (
        <ChecklistSelectionModal
          isOpen={checklistSelectionOpen}
          onClose={() => setChecklistSelectionOpen(false)}
          onSelectChecklist={onChecklistSelect}
        />
      )}
    </div>
  );
}

export default QuickAccess;


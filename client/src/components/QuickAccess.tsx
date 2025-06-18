import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderIcon } from "@/lib/icon-utils";
import DeviationModal from "@/components/DeviationModal";
import type { Checklist } from "@shared/schema";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  // Check if user has access to checklists module
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const hasChecklistsModule = authData?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule = authData?.tenant?.modules?.includes("deviations") ?? false;

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
  
  if (!hasChecklistItems && !hasDeviationButton) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 py-2 overflow-x-auto">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Snabbåtkomst:
          </span>
          
          {/* Checklist buttons */}
          {hasChecklistItems && menuChecklists.map((checklist) => (
            <button
              key={`checklist-${checklist.id}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(
                  "Checklist button clicked:",
                  checklist.id,
                  checklist.name,
                );
                onChecklistSelect(checklist.id);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center gap-2 transition-all duration-200 cursor-pointer bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md border border-gray-200 dark:border-gray-600 whitespace-nowrap"
              type="button"
            >
              {renderIcon(checklist.icon, "h-3 w-3") || (
                <CheckSquare className="h-3 w-3" />
              )}
              {checklist.name}
            </button>
          ))}
          
          {/* Deviation create button */}
          {hasDeviationButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDeviationModalOpen(true)}
              className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 whitespace-nowrap"
            >
              <Plus className="h-3 w-3 mr-1" />
              Skapa avvikelse
            </Button>
          )}
        </div>
      </div>
      
      {/* Deviation Modal */}
      <DeviationModal 
        isOpen={isDeviationModalOpen} 
        onClose={() => setIsDeviationModalOpen(false)}
      />
    </div>
  );
}

export default QuickAccess;
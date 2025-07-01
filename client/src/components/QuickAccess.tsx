import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { renderIcon } from "@/lib/icon-utils";
import DeviationModal from "@/components/DeviationModal";
import type { Checklist } from "@shared/schema";
import clsx from "clsx"; // eller classnames
import IconActionButton from "./ui/actionbutton";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="grid grid-cols-2 gap-3">
          {hasChecklistItems && menuChecklists.slice(0, 2).map((checklist) => (
            <button
              key={checklist.id}
              onClick={() => onChecklistSelect(checklist.id)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-100 hover:bg-gray-200 transition-colors min-h-[80px]"
            >
              <div className="mb-2 text-gray-600">
                {renderIcon(checklist.icon, "h-6 w-6")}
              </div>
              <span className="text-sm font-medium text-gray-900 text-center leading-tight">
                {checklist.name}
              </span>
            </button>
          ))}

          {hasDeviationButton && (
            <button
              onClick={() => setIsDeviationModalOpen(true)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors min-h-[80px]"
            >
              <div className="mb-2 text-red-600">
                <Plus className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium text-red-900 text-center leading-tight">
                Ny avvikelse
              </span>
            </button>
          )}
          
          {/* Fill remaining slots with additional checklists if available */}
          {hasChecklistItems && menuChecklists.length > 2 && (
            menuChecklists.slice(2, 4).map((checklist) => (
              <button
                key={checklist.id}
                onClick={() => onChecklistSelect(checklist.id)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors min-h-[80px]"
              >
                <div className="mb-2 text-blue-600">
                  {renderIcon(checklist.icon, "h-6 w-6")}
                </div>
                <span className="text-sm font-medium text-blue-900 text-center leading-tight">
                  {checklist.name}
                </span>
              </button>
            ))
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
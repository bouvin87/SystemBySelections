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
  const numButtons =
    (hasChecklistItems ? menuChecklists.length : 0) + (hasDeviationButton ? 1 : 0);
  const numCols = Math.min(numButtons, 4); // max 4 kolumner
  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center md:justify-start">
          <div className={clsx(`grid gap-4 py-4`, `grid-cols-${numCols}`)}>
            {hasChecklistItems && menuChecklists.map((checklist) => (
              <IconActionButton
                key={checklist.id}
                label={checklist.name}
                icon={renderIcon(checklist.icon, "h-5 w-5")}
                onClick={() => onChecklistSelect(checklist.id)}
              />
            ))}

            {hasDeviationButton && (
              <IconActionButton
                icon={<Plus className="w-5 h-5" />}
                label="Ny avvikelse"
                onClick={() => setIsDeviationModalOpen(true)}
              />
            )}
          </div>
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
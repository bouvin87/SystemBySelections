import { useQuery } from "@tanstack/react-query";
import { CheckSquare } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import type { Checklist } from "@shared/schema";

interface ChecklistQuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
}

function ChecklistQuickAccess({ onChecklistSelect }: ChecklistQuickAccessProps) {
  // Check if user has access to checklists module
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const hasChecklistsModule = authData?.tenant?.modules?.includes("checklists") ?? false;

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

  // Don't render if no access or no checklists
  if (!hasChecklistsModule || menuChecklists.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 py-2 overflow-x-auto">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Snabbåtkomst:
          </span>
          {menuChecklists.map((checklist) => (
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
        </div>
      </div>
    </div>
  );
}

export default ChecklistQuickAccess;
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  ClipboardList,
  ChartArea,
  LayoutDashboard,
} from "lucide-react";
import DeviationModal from "@/components/DeviationModal";
import type { Checklist } from "@shared/schema";
import { renderIcon } from "@/lib/icon-utils";
import ChecklistSelectionModal from "./ChecklistSelectionModal";
import clsx from "clsx";
import { useLocation } from "wouter";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
  setChecklistSelectionOpen: (val: boolean) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  const [checklistSelectionOpen, setChecklistSelectionOpen] = useState(false);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenSubmenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const hasChecklistsModule =
    (authData as any)?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule =
    (authData as any)?.tenant?.modules?.includes("deviations") ?? false;

  const { data: menuChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active", "menu"],
    enabled: hasChecklistsModule,
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const result = await fetch("/api/checklists/active", { headers });
      if (!result.ok)
        throw new Error(`Failed to fetch active checklists: ${result.status}`);
      const activeChecklists = await result.json();
      return activeChecklists.filter((c: Checklist) => c.showInMenu);
    },
  });

  const { data: deviationSettings } = useQuery({
    queryKey: ["/api/deviations/settings"],
    enabled: hasDeviationsModule,
  });

  type SubmenuItem = {
    id: string;
    icon: JSX.Element;
    label: string;
    onClick: () => void;
  };

  const allButtons: {
    id: string;
    icon: JSX.Element;
    label: string;
    onClick?: () => void;
    submenu?: SubmenuItem[];
  }[] = [];

  if (hasDeviationsModule && deviationSettings?.showCreateButtonInMenu) {
    allButtons.push({
      id: "deviations",
      icon: <Plus className="h-6 w-6" />,
      label: "Avvikelser",
      onClick: () =>
        setOpenSubmenuId((prev) => (prev === "deviations" ? null : "deviations")),
      submenu: [
        {
          id: "deviation-dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />,
          label: "Dashboard",
          onClick: () => {
            setLocation("/deviations");
            setOpenSubmenuId(null);
          },
        },
        {
          id: "deviation-create",
          icon: <Plus className="h-5 w-5" />,
          label: "Ny avvikelse",
          onClick: () => {
            setIsDeviationModalOpen(true);
            setOpenSubmenuId(null);
          },
        },
      ],
    });
  }

  if (hasChecklistsModule) {
    const submenu: SubmenuItem[] = [
      {
        id: "checklist-link",
        icon: <ChartArea className="h-5 w-5" />,
        label: "Dashboards",
        onClick: () => {
          setLocation("/checklists");
          setOpenSubmenuId(null);
        },
      },
      {
        id: "checklist-select",
        icon: <ClipboardList className="h-5 w-5" />,
        label: "Välj...",
        onClick: () => {
          setChecklistSelectionOpen(true);
          setOpenSubmenuId(null);
        },
      },
    ];

    if (menuChecklists.length > 0) {
      const checklistItems: SubmenuItem[] = menuChecklists.map((checklist) => ({
        id: `checklist-${checklist.id}`,
        icon:
          renderIcon(checklist.icon, "h-5 w-5") || <CheckSquare className="h-5 w-5" />,
        label: checklist.name,
        onClick: () => {
          onChecklistSelect(checklist.id);
          setOpenSubmenuId(null);
        },
      }));

      submenu.push(...checklistItems);
    }

    allButtons.push({
      id: "checklists",
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Checklistor",
      onClick: () =>
        setOpenSubmenuId((prev) => (prev === "checklists" ? null : "checklists")),
      submenu,
    });
  }

  return (
    <div
      ref={menuRef}
      className="fixed bottom-0 left-0 right-0 z-10 modern-nav safe-area-inset-bottom bg-white border-t"
    >
      <div className="max-w-md mx-auto px-4 py-3 relative">
        <div className="flex justify-around items-end relative">
          {allButtons.map((button) => (
            <div key={button.id} className="flex flex-col items-center">
              <button
                onClick={button.onClick}
                className={clsx(
                  "flex flex-col items-center justify-center py-2 px-2 modern-button min-w-[50px]",
                  "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="mb-1">{button.icon}</div>
                <span className="text-xs font-medium text-center leading-tight">
                  {button.label}
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Centralt placerade submenyer */}
        {allButtons.map((button) =>
          openSubmenuId === button.id && button.submenu ? (
            <div
              key={`${button.id}-submenu`}
              className="absolute bottom-16 left-1/2 -translate-x-1/2 mb-2 flex gap-3 bg-white shadow-xl px-3 py-2 rounded-xl z-20 max-w-[95vw] overflow-x-auto"
            >
              {/* Första två knappar */}
              {button.submenu.slice(0, 2).map((sub) => (
                <button
                  key={sub.id}
                  onClick={sub.onClick}
                  className="flex flex-col items-center justify-center w-16"
                >
                  <div className="w-10 h-10 mb-1 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    {sub.icon}
                  </div>
                  <span className="text-xs text-gray-800 text-center leading-tight">
                    {sub.label}
                  </span>
                </button>
              ))}

              {/* Divider om fler än 2 */}
              {button.submenu.length > 2 && (
                <div className="w-px h-10 bg-gray-300 mx-2 opacity-50 self-center" />
              )}

              {/* Resterande knappar */}
              {button.submenu.slice(2).map((sub) => (
                <button
                  key={sub.id}
                  onClick={sub.onClick}
                  className="flex flex-col items-center justify-center w-16"
                >
                  <div className="w-10 h-10 mb-1 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    {sub.icon}
                  </div>
                  <span className="text-xs text-gray-800 text-center leading-tight">
                    {sub.label}
                  </span>
                </button>
              ))}
            </div>
          ) : null
        )}
      </div>

      {/* Modals */}
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

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  ClipboardList,
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

type SubmenuItem = {
  id: string;
  type?: "item";
  icon: JSX.Element;
  label: string;
  onClick: () => void;
};

type SubmenuDivider = {
  id: string;
  type: "divider";
};

type SubmenuEntry = SubmenuItem | SubmenuDivider;

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
  const hasKanbanModule =
    (authData as any)?.tenant?.modules?.includes("kanban") ?? false;

  const { data: menuChecklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists/active", "menu"],
    enabled: hasChecklistsModule,
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const result = await fetch("/api/checklists/active", { headers });
      if (!result.ok)
        throw new Error(`Failed to fetch checklists: ${result.status}`);
      return (await result.json()).filter((c: Checklist) => c.showInMenu);
    },
  });

  const { data: menuKanban = [] } = useQuery({
    queryKey: ["/api/kanban/preferences", "menu"],
    enabled: hasKanbanModule,
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const result = await fetch("/api/kanban/preferences", { headers });
      if (!result.ok)
        throw new Error(`Failed to fetch kanban: ${result.status}`);
      return (await result.json()).filter(
        (k: any) => k.boardId && k.showInQuickAccess,
      );
    },
  });

  const { data: deviationSettings } = useQuery({
    queryKey: ["/api/deviations/settings"],
    enabled: hasDeviationsModule,
  });

  const allButtons: {
    id: string;
    icon: JSX.Element;
    label: string;
    onClick?: () => void;
    submenu?: SubmenuEntry[];
  }[] = [];

  // Deviation menu
  if (hasDeviationsModule && deviationSettings?.showCreateButtonInMenu) {
    allButtons.push({
      id: "deviations",
      icon: <Plus className="h-6 w-6" />,
      label: "Avvikelser",
      onClick: () =>
        setOpenSubmenuId((prev) =>
          prev === "deviations" ? null : "deviations",
        ),
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

  // Checklists menu
  if (hasChecklistsModule) {
    const submenu: SubmenuEntry[] = [
      {
        id: "checklist-link",
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboards",
        onClick: () => {
          setLocation("/checklists");
          setOpenSubmenuId(null);
        },
      },
      {
        id: "checklist-select",
        icon: <Plus className="h-5 w-5" />,
        label: "Välj...",
        onClick: () => {
          setChecklistSelectionOpen(true);
          setOpenSubmenuId(null);
        },
      },
    ];

    if (menuChecklists.length > 0) {
      submenu.push({ id: "divider-checklists", type: "divider" });

      submenu.push(
        ...menuChecklists.map((checklist) => ({
          id: `checklist-${checklist.id}`,
          icon: renderIcon(checklist.icon, "h-5 w-5") || (
            <CheckSquare className="h-5 w-5" />
          ),
          label: checklist.name,
          onClick: () => {
            onChecklistSelect(checklist.id);
            setOpenSubmenuId(null);
          },
        })),
      );
    }

    allButtons.push({
      id: "checklists",
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Checklistor",
      onClick: () =>
        setOpenSubmenuId((prev) =>
          prev === "checklists" ? null : "checklists",
        ),
      submenu,
    });
  }

  // Kanban menu
  if (hasKanbanModule) {
    const submenu: SubmenuEntry[] = [
      {
        id: "kanban-link",
        icon: <LayoutDashboard className="h-5 w-5" />,
        label: "Dashboards",
        onClick: () => {
          setLocation("/kanban");
          setOpenSubmenuId(null);
        },
      },
    ];

    if (menuKanban.length > 0) {
      submenu.push({ id: "divider-kanban", type: "divider" });

      submenu.push(
        ...menuKanban.map((kanban) => ({
          id: `kanban-${kanban.id}`,
          icon: renderIcon(kanban.kanbanBoard?.icon, "h-5 w-5") || (
            <CheckSquare className="h-5 w-5" />
          ),
          label: kanban.kanbanBoard?.name || kanban.boardId,
          onClick: () => {
            setLocation(`/kanban/${kanban.boardId}`);
            setOpenSubmenuId(null);
          },
        })),
      );
    }

    allButtons.push({
      id: "kanban",
      icon: <ClipboardList className="h-6 w-6" />,
      label: "Kanban",
      onClick: () =>
        setOpenSubmenuId((prev) => (prev === "kanban" ? null : "kanban")),
      submenu,
    });
  }

  return (
    <div
      ref={menuRef}
      className="fixed bottom-0 left-0 right-0 z-10  safe-area-inset-bottom bg-background"
    >
      <div className="max-w-md mx-auto px-4 py-3 relative ">
        <div className="flex justify-around items-end relative">
          {allButtons.map((button) => (
            <div key={button.id} className="flex flex-col items-center">
              <button
                onClick={button.onClick}
                className={clsx(
                  "flex flex-col items-center justify-center py-2 px-2 modern-button min-w-[50px]",
                  "text-muted-foreground hover:text-foreground",
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

        {/* Submenu */}
        {allButtons.map(
          (button) =>
            openSubmenuId === button.id &&
            button.submenu && (
              <div
                key={`${button.id}-submenu`}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 mb-2 flex flex-col md:flex-row gap-2 bg-background dark:border shadow-xl px-4 py-3 rounded-xl z-20 max-h-[80vh] overflow-y-auto "
              >
                {button.submenu.map((sub) =>
                  sub.type === "divider" ? (
                    <div
                      key={sub.id}
                      className="h-px w-full md:w-px md:h-10 bg-gray-300 mx-0 md:mx-2 my-2 md:my-0 opacity-50 self-center"
                    />
                  ) : (
                    <button
                      key={sub.id}
                      onClick={sub.onClick}
                      className="group flex flex-row md:flex-col items-center gap-2 w-full md:w-16 text-muted-foreground hover:text-foreground transition"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center 
                                   bg-secondary group-hover:bg-primary 
                                   transition-colors"
                      >
                        <div className="text-primary group-hover:text-primary-foreground">
                          {sub.icon}
                        </div>
                      </div>

                      <span className="text-xs text-left md:text-center leading-tight truncate md:w-16">
                        {sub.label}
                      </span>
                    </button>


                  ),
                )}
              </div>
            ),
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

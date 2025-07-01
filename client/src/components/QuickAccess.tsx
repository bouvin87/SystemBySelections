import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Plus, Home, ClipboardList, AlertTriangle, User, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";
import { renderIcon } from "@/lib/icon-utils";
import DeviationModal from "@/components/DeviationModal";
import type { Checklist } from "@shared/schema";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  
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
  const hasDeviationButton = hasDeviationsModule && (deviationSettings as any)?.showCreateButtonInMenu;
  
  if (!hasChecklistItems && !hasDeviationButton) {
    return (
      // Fallback bottom navigation when no dynamic items
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around h-20 px-4">
            <button
              onClick={() => setLocation("/")}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                location === "/" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium">Hem</span>
            </button>
            
            {hasChecklistsModule && (
              <button
                onClick={() => setLocation("/checklists")}
                className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                  location === "/checklists" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <ClipboardList className="h-6 w-6" />
                <span className="text-xs font-medium">Checklistor</span>
              </button>
            )}
            
            {hasDeviationsModule && (
              <button
                onClick={() => setLocation("/deviations")}
                className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                  location === "/deviations" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <AlertTriangle className="h-6 w-6" />
                <span className="text-xs font-medium">Avvikelser</span>
              </button>
            )}
            
            <button
              onClick={() => setLocation("/profile")}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                location === "/profile" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Profil</span>
            </button>
            
            <button
              onClick={() => setLocation("/more")}
              className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                location === "/more" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MoreHorizontal className="h-6 w-6" />
              <span className="text-xs font-medium">Mer</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate how many dynamic buttons we have
  const dynamicButtons = [...menuChecklists];
  if (hasDeviationButton) {
    dynamicButtons.push({ id: 'deviation', name: 'Ny avvikelse', icon: 'plus' } as any);
  }

  // Static navigation items
  const staticNavItems = [
    { icon: Home, label: "Hem", path: "/", isActive: location === "/" },
    ...(hasChecklistsModule ? [{ icon: ClipboardList, label: "Checklistor", path: "/checklists", isActive: location === "/checklists" }] : []),
    ...(hasDeviationsModule ? [{ icon: AlertTriangle, label: "Avvikelser", path: "/deviations", isActive: location === "/deviations" }] : []),
    { icon: User, label: "Profil", path: "/profile", isActive: location === "/profile" },
    { icon: MoreHorizontal, label: "Mer", path: "/more", isActive: location === "/more" }
  ];

  return (
    <>
      {/* Dynamic Quick Access - Top bar with dynamic checklist buttons */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {hasChecklistItems && menuChecklists.map((checklist) => (
              <button
                key={checklist.id}
                onClick={() => onChecklistSelect(checklist.id)}
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-2">
                  {renderIcon(checklist.icon, "h-5 w-5 text-blue-600") || (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900 text-center leading-tight">
                  {checklist.name}
                </span>
              </button>
            ))}

            {hasDeviationButton && (
              <button
                onClick={() => setIsDeviationModalOpen(true)}
                className="flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center mb-2">
                  <Plus className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-xs font-medium text-gray-900 text-center leading-tight">
                  Ny avvikelse
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Navigation - Fixed at bottom with reference design */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around h-20 px-4">
            {staticNavItems.map((item, index) => {
              const Icon = item.icon;
              const isCenter = index === Math.floor(staticNavItems.length / 2);
              
              if (isCenter && (hasChecklistItems || hasDeviationButton)) {
                // Central action button (blue circle) - only show when we have dynamic content
                return (
                  <div key={item.path} className="relative">
                    <button
                      onClick={hasChecklistItems ? () => onChecklistSelect(menuChecklists[0]?.id) : () => setIsDeviationModalOpen(true)}
                      className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-6 w-6 text-white" />
                    </button>
                  </div>
                );
              }
              
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`flex flex-col items-center justify-center space-y-1 px-3 py-2 transition-colors ${
                    item.isActive 
                      ? "text-blue-600" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <div className={`p-1 ${item.isActive ? "bg-blue-50 rounded-lg" : ""}`}>
                    <Icon className={`h-6 w-6 ${item.isActive ? "text-blue-600" : ""}`} />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.isActive && (
                    <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Deviation Modal */}
      <DeviationModal 
        isOpen={isDeviationModalOpen} 
        onClose={() => setIsDeviationModalOpen(false)}
      />
    </>
  );
}

export default QuickAccess;
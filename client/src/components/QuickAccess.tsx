import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Home, ClipboardList, AlertTriangle, User, MoreHorizontal, Plus } from "lucide-react";
import { useLocation } from "wouter";
import DeviationModal from "@/components/DeviationModal";
import FormModal from "@/components/FormModal";
import { useDeviceType } from "@/hooks/useDeviceType";

interface QuickAccessProps {
  onChecklistSelect: (checklistId: number) => void;
}

function QuickAccess({ onChecklistSelect }: QuickAccessProps) {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { isMobile } = useDeviceType();
  const [isDeviationModalOpen, setIsDeviationModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  
  // Check if user has access to modules
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });
  
  const hasChecklistsModule = (authData as any)?.tenant?.modules?.includes("checklists") ?? false;
  const hasDeviationsModule = (authData as any)?.tenant?.modules?.includes("deviations") ?? false;

  const handleNewChecklist = () => {
    if (isMobile) {
      setLocation("/mobile/checklist");
    } else {
      setIsChecklistModalOpen(true);
    }
  };

  const handleNewDeviation = () => {
    if (isMobile) {
      setLocation("/mobile/deviation");
    } else {
      setIsDeviationModalOpen(true);
    }
  };

  // Bottom navigation items
  const navItems = [
    {
      icon: Home,
      label: "Hem",
      path: "/",
      isActive: location === "/"
    },
    {
      icon: ClipboardList,
      label: "Checklistor",
      path: "/checklists",
      isActive: location === "/checklists",
      enabled: hasChecklistsModule
    },
    {
      icon: AlertTriangle,
      label: "Avvikelser", 
      path: "/deviations",
      isActive: location === "/deviations",
      enabled: hasDeviationsModule
    },
    {
      icon: User,
      label: "Profil",
      path: "/profile",
      isActive: location === "/profile"
    },
    {
      icon: MoreHorizontal,
      label: "Mer",
      path: "/more",
      isActive: location === "/more"
    }
  ];

  // Filter enabled items
  const enabledItems = navItems.filter(item => item.enabled !== false);

  return (
    <>
      {/* Bottom Navigation - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around h-20 px-4">
            {enabledItems.map((item, index) => {
              const Icon = item.icon;
              const isCenter = index === Math.floor(enabledItems.length / 2);
              
              if (isCenter) {
                // Central action button (blue circle)
                return (
                  <div key={item.path} className="relative">
                    <button
                      onClick={hasChecklistsModule ? handleNewChecklist : handleNewDeviation}
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
      
      {/* Modals - only show on desktop */}
      {!isMobile && (
        <>
          <DeviationModal 
            isOpen={isDeviationModalOpen} 
            onClose={() => setIsDeviationModalOpen(false)}
          />
          <FormModal
            isOpen={isChecklistModalOpen}
            onClose={() => setIsChecklistModalOpen(false)}
          />
        </>
      )}
    </>
  );
}

export default QuickAccess;
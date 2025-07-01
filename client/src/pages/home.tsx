import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import BottomNavigation from "@/components/BottomNavigation";
import { ClipboardList, AlertTriangle, BarChart3, Plus, TrendingUp } from "lucide-react";
import { useState } from "react";
import FormModal from "@/components/FormModal";
import DeviationModal from "@/components/DeviationModal";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const { isMobile } = useDeviceType();
  const [, setLocation] = useLocation();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeviationModal, setShowDeviationModal] = useState(false);

  // Query for production statistics
  const { data: responses = [] } = useQuery({
    queryKey: ["/api/responses"],
    retry: false
  });

  const { data: deviations = [] } = useQuery({
    queryKey: ["/api/deviations"],
    retry: false
  });

  const { data: activeChecklists = [] } = useQuery({
    queryKey: ["/api/checklists/active"],
    retry: false
  });

  const displayName = (user as any)?.name || user?.email?.split('@')[0] || "Användare";
  
  // Calculate today's count from responses
  const today = new Date().toDateString();
  const todayCount = (responses as any[]).filter((response: any) => 
    new Date(response.createdAt).toDateString() === today
  ).length;
  
  // Calculate open deviations count
  const openDeviationsCount = (deviations as any[]).filter((deviation: any) => 
    deviation.status?.name !== "Stängd" && deviation.status?.name !== "Löst"
  ).length;

  const handleNewChecklist = () => {
    if (isMobile) {
      setLocation("/mobile/checklist");
    } else {
      setShowFormModal(true);
    }
  };

  const handleNewDeviation = () => {
    if (isMobile) {
      setLocation("/mobile/deviation");
    } else {
      setShowDeviationModal(true);
    }
  };

  return (
    <div className="app-container min-h-screen text-slate-900">
      {/* Header with notification */}
      <div className="flex justify-between items-center px-6 pt-12 pb-6">
        <div>
          <p className="text-sm text-slate-600">Hej {displayName},</p>
        </div>
        <div className="relative">
          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 -right-1"></div>
            <span className="text-sm">🔔</span>
          </div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 pb-32 space-y-8">
        {/* Main Balance Display */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-light text-slate-900">{todayCount}</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-sm flex items-center justify-center">
              <span className="text-white text-xs font-bold">SBH</span>
            </div>
            <p className="text-sm text-slate-600 font-medium">kontroller idag ▼</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">Översikt av systemet</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="status-card bg-slate-100/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-light text-slate-900">{(activeChecklists as any[]).length}</p>
                  <p className="text-sm text-slate-600 font-medium">Aktiva checklistor</p>
                </div>
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>
            </div>

            <div className="status-card bg-green-100/60 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-light text-slate-900">{openDeviationsCount}</p>
                  <p className="text-sm text-slate-600 font-medium">Öppna avvikelser</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">Här är några saker du kan göra</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleNewChecklist}
              className="action-card p-6 text-left bg-slate-50"
            >
              <Plus className="h-6 w-6 mb-3 text-slate-700" />
              <p className="font-medium text-sm text-slate-900">Ny kontroll</p>
              <p className="text-xs text-slate-500 mt-1">Starta en ny checklista</p>
            </button>

            <button 
              onClick={handleNewDeviation}
              className="action-card p-6 text-left bg-green-50"
            >
              <AlertTriangle className="h-6 w-6 mb-3 text-slate-700" />
              <p className="font-medium text-sm text-slate-900">Rapportera avvikelse</p>
              <p className="text-xs text-slate-500 mt-1">Skapa ny rapport från användare</p>
            </button>

            <button 
              onClick={() => setLocation("/deviations")}
              className="action-card p-6 text-left bg-orange-50"
            >
              <BarChart3 className="h-6 w-6 mb-3 text-slate-700" />
              <p className="font-medium text-sm text-slate-900">Visa avvikelser</p>
              <p className="text-xs text-slate-500 mt-1">Inga avgifter när du granskar</p>
            </button>

            <button 
              onClick={() => setLocation("/checklists")}
              className="action-card p-6 text-left bg-slate-100"
            >
              <ClipboardList className="h-6 w-6 mb-3 text-slate-700" />
              <p className="font-medium text-sm text-slate-900">Checklistor</p>
              <p className="text-xs text-slate-500 mt-1">Toppa upp eller skicka data</p>
            </button>
          </div>
        </div>

        {/* Your favorites people */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-800">Dina favoritanvändare</p>
          <div className="flex gap-4 items-center">
            <div className="flex flex-col items-center text-sm text-slate-500">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-xl border-2 border-dashed border-slate-300">+</div>
              <span className="text-xs mt-2 font-medium">Lägg till</span>
            </div>
            <div className="flex flex-col items-center text-sm">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm">
                G
              </div>
              <span className="text-xs mt-2 font-medium text-slate-600">Grace L.</span>
            </div>
            <div className="flex flex-col items-center text-sm">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center font-semibold text-white border-2 border-white shadow-sm">
                LA
              </div>
              <span className="text-xs mt-2 font-medium text-slate-600">Lawrence A.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals - only show on desktop */}
      {!isMobile && (
        <>
          <FormModal 
            isOpen={showFormModal} 
            onClose={() => setShowFormModal(false)} 
          />
          <DeviationModal 
            isOpen={showDeviationModal} 
            onClose={() => setShowDeviationModal(false)} 
          />
        </>
      )}
    </div>
  );
}
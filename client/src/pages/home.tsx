import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
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
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <main className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <p className="text-sm">Hej {displayName},</p>
          <h1 className="text-3xl font-bold">{todayCount}</h1>
          <p className="text-sm text-gray-500">kontroller idag</p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-900">{(activeChecklists as any[]).length}</p>
                <p className="text-sm text-blue-700">Aktiva checklistor</p>
              </div>
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-900">{openDeviationsCount}</p>
                <p className="text-sm text-red-700">Öppna avvikelser</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>



        {/* Recent Activity */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Senaste aktivitet</p>
          <div className="space-y-2">
            {(responses as any[]).filter((response: any) => 
              new Date(response.createdAt).toDateString() === today
            ).slice(0, 3).map((response: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Kontroll slutförd</p>
                    <p className="text-xs text-gray-500">
                      {new Date(response.createdAt).toLocaleTimeString('sv-SE')}
                    </p>
                  </div>
                </div>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            ))}
            
            {todayCount === 0 && (
              <div className="text-center py-6 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga kontroller registrerade idag</p>
                <p className="text-xs">Börja genom att skapa en ny kontroll</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Quick Access Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-4 gap-3">
            <button 
              onClick={handleNewChecklist}
              className="flex flex-col items-center p-3 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Ny kontroll</span>
            </button>

            <button 
              onClick={handleNewDeviation}
              className="flex flex-col items-center p-3 rounded-2xl bg-orange-50 hover:bg-orange-100 transition-colors"
            >
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Avvikelse</span>
            </button>

            <button 
              onClick={() => setLocation("/deviations")}
              className="flex flex-col items-center p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Avvikelser</span>
            </button>

            <button 
              onClick={() => setLocation("/checklists")}
              className="flex flex-col items-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-700 font-medium">Checklistor</span>
            </button>
          </div>
        </div>
      </div>

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
import Navigation from "@/components/Navigation";
import { HelpCircle, Settings, Languages, Crown, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import LanguageSelector from "@/components/LanguageSelector";

export default function More() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    {
      icon: HelpCircle,
      label: "Vanliga frågor",
      path: "/faq",
      description: "Få svar på vanliga frågor"
    },
    {
      icon: Info,
      label: "Om appen",
      path: "/about",
      description: "Information om System by Selection"
    }
  ];

  // Admin items
  const adminItems = [];
  if (user?.role === "admin") {
    adminItems.push({
      icon: Settings,
      label: "Administration",
      path: "/admin",
      description: "Hantera systemet"
    });
  }

  if (user?.role === "superadmin") {
    adminItems.push({
      icon: Crown,
      label: "Super Admin",
      path: "/super-admin",
      description: "Systemadministration"
    });
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <main className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mer</h1>
          <p className="text-sm text-gray-500">Ytterligare inställningar och information</p>
        </div>

        {/* Language Selection */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Språk</h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <LanguageSelector />
          </div>
        </div>

        {/* General Menu Items */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Allmänt</h2>
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  onClick={() => setLocation(item.path)}
                >
                  <div className="flex items-center w-full">
                    <Icon className="h-5 w-5 mr-3 text-gray-600" />
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Admin Section */}
        {adminItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Administration</h2>
            <div className="space-y-2">
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.path}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setLocation(item.path)}
                  >
                    <div className="flex items-center w-full">
                      <Icon className="h-5 w-5 mr-3 text-gray-600" />
                      <div className="text-left flex-1">
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* App Version */}
        <div className="pt-6 border-t border-gray-200">
          <div className="text-center text-xs text-gray-500">
            <p>System by Selection</p>
            <p>Version 1.0.0</p>
          </div>
        </div>
      </main>
    </div>
  );
}
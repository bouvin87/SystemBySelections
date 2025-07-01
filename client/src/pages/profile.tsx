import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { User, Building2, Crown, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const tenant = (authData as any)?.tenant || { name: 'System by Selection' };

  const displayName = (user as any)?.firstName && (user as any)?.lastName
    ? `${(user as any).firstName} ${(user as any).lastName}`
    : user?.email;

  const initials = displayName
    ?.split(" ")
    .map((name: string) => name.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "superadmin":
        return "Super Admin";
      case "admin":
        return "Administrator";
      case "underadmin":
        return "Underadmin";
      default:
        return "Användare";
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navigation />

      <main className="max-w-md mx-auto px-4 pt-6 pb-24 space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl font-bold text-blue-700">
              {initials}
            </span>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        {/* User Info */}
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Organisation</p>
                <p className="text-sm text-gray-600">{tenant.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Roll</p>
                <p className="text-sm text-gray-600">{getRoleDisplayName(user?.role || "user")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Admin Panel */}
          {user?.role === "admin" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/admin")}
            >
              <Settings className="h-4 w-4 mr-3" />
              Administration
            </Button>
          )}

          {/* Super Admin Panel */}
          {user?.role === "superadmin" && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setLocation("/super-admin")}
            >
              <Crown className="h-4 w-4 mr-3" />
              Super Admin
            </Button>
          )}

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logga ut
          </Button>
        </div>
      </main>
    </div>
  );
}
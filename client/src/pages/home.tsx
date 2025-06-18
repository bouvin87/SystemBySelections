import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, Clock } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function Home() {
  const { user } = useAuth();
  
  // Fetch user data to get tenant information
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const tenant = authData?.tenant || { name: 'System by Selection' };
  const currentDate = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.email;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Välkommen till {tenant.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              Hej {displayName}! Bra att se dig igen.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {currentDate}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {currentTime}
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Building2 className="h-5 w-5" />
                Organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-800 dark:text-blue-200 font-medium">{tenant.name}</p>
              <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                Din aktiva organisation
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Users className="h-5 w-5" />
                Användarroll
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                {user?.role === 'admin' ? 'Administratör' : 'Användare'}
              </Badge>
              <p className="text-sm text-green-600 dark:text-green-300 mt-2">
                {user?.role === 'admin' 
                  ? 'Du har full åtkomst till systemet'
                  : 'Du har standardåtkomst till systemet'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
                <Clock className="h-5 w-5" />
                Systemstatus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-purple-800 dark:text-purple-200 font-medium">Aktiv</span>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-300 mt-1">
                Alla system fungerar normalt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Available Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Tillgängliga moduler</CardTitle>
            <CardDescription>
              Här är de moduler du har åtkomst till baserat på din organisation och roll
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {authData?.tenant?.modules?.includes('checklists') && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Checklistor</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Hantera och genomför checklistor för kvalitetskontroll
                  </p>
                </div>
              )}
              
              {authData?.tenant?.modules?.includes('deviations') && (
                <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                  <h3 className="font-medium text-red-900 dark:text-red-100 mb-1">Avvikelser</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Rapportera och hantera avvikelser och förbättringsåtgärder
                  </p>
                </div>
              )}
              
              {user?.role === 'admin' && (
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Administration</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Systemadministration och användarhantering
                  </p>
                </div>
              )}
            </div>
            
            {(!authData?.tenant?.modules || authData.tenant.modules.length === 0) && (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Inga moduler är aktiverade för din organisation. Kontakta din administratör för åtkomst.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
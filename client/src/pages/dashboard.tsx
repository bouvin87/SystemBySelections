import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { BarChart, TrendingUp } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import type { Checklist } from "@shared/schema";

export default function Dashboard() {
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  // Filter checklists that have dashboard enabled
  const dashboardChecklists = checklists.filter(checklist => 
    checklist.hasDashboard && checklist.isActive
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Produktionsloggning</h1>
          <p className="text-xl text-gray-600">Välj en dashboard för att se statistik och data</p>
        </div>
        
        {dashboardChecklists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardChecklists.map((checklist) => (
              <Card key={checklist.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {renderIcon(checklist.icon, "h-5 w-5 text-blue-600") || <BarChart className="h-5 w-5 text-blue-600" />}
                    {checklist.name}
                  </CardTitle>
                  {checklist.description && (
                    <p className="text-sm text-gray-600">{checklist.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <Link href={`/checklist/${checklist.id}/dashboard`}>
                    <Button className="w-full" size="lg">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Visa Dashboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <BarChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga dashboards tillgängliga
              </h3>
              <p className="text-gray-600 mb-6">
                Det finns inga checklistor med aktiverad dashboard-funktion.
              </p>
              <Link href="/admin">
                <Button>
                  Gå till Administration
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
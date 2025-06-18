import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { AlertTriangle, BarChart, TrendingUp, ListChecks } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  // Filter checklists that have dashboard enabled
  const dashboardChecklists = checklists.filter(
    (checklist) => checklist.hasDashboard && checklist.isActive,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ListChecks className="h-8 w-8 text-green-600" />
              {t("common.checklists")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("dashboard.selectDashboard")}
            </p>
          </div>
        </div>

        {dashboardChecklists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardChecklists.map((checklist) => (
              <Card
                key={checklist.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {renderIcon(checklist.icon, "h-5 w-5 text-blue-600") || (
                      <BarChart className="h-5 w-5 text-blue-600" />
                    )}
                    {checklist.name}
                  </CardTitle>
                  {checklist.description && (
                    <p className="text-sm text-gray-600">
                      {checklist.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <Link href={`/checklist/${checklist.id}/dashboard`}>
                    <Button className="w-full" size="lg">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      {t("dashboard.viewDashboard")}
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
                {t("dashboard.noDashboardsAvailable")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("dashboard.noDashboardsDescription")}
              </p>
              <Link href="/admin">
                <Button>{t("dashboard.goToAdmin")}</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

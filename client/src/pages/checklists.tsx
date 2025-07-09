import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ListChecks, BarChart, ArrowLeft } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";
import { Button } from "@/components/ui/button";

export default function Checklists() {
  const { t } = useTranslation();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  const dashboardChecklists = checklists.filter(
    (checklist) => checklist.hasDashboard && checklist.isActive,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      {/* Menyrad */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("common.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {t("common.checklists")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.selectDashboard")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="max-w-md mx-auto px-4 pt-6 pb-32 space-y-6">
        {dashboardChecklists.length > 0 ? (
          <div className="modern-card-grid">
            {dashboardChecklists.map((checklist, index) => (
              <Link
                key={checklist.id}
                href={`/checklist/${checklist.id}/dashboard`}
                className="modern-action-card bg-pastel-green text-left"
              >
                {renderIcon(checklist.icon, "h-5 w-5 mb-2 text-primary") || (
                  <BarChart className="h-5 w-5 mb-2 text-primary" />
                )}
                <p className="font-medium text-sm">{checklist.name}</p>
                {checklist.description && (
                  <p className="text-xs text-muted-foreground">
                    {checklist.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-10 text-center border border-border">
            <BarChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t("dashboard.noDashboardsAvailable")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("dashboard.noDashboardsDescription")}
            </p>
            <Link href="/admin" className="inline-block">
              <span className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                {t("dashboard.goToAdmin")}
              </span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

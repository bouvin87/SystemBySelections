import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { ListChecks, BarChart } from "lucide-react";
import { renderIcon } from "@/lib/icon-utils";
import { useTranslation } from "react-i18next";
import type { Checklist } from "@shared/schema";

export default function Checklists() {
  const { t } = useTranslation();
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
  });

  const dashboardChecklists = checklists.filter(
    (checklist) => checklist.hasDashboard && checklist.isActive,
  );

  return (
    <div className="min-h-screen bg-background text-foreground pb-[theme(spacing.20)]">
      <Navigation />
      <main className="max-w-md mx-auto px-4 pt-6 pb-32 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListChecks className="h-8 w-8 text-primary" />
            {t("common.checklists")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.selectDashboard")}
          </p>
        </div>

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

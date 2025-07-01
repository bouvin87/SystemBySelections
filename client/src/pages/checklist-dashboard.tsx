import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Navigation from "@/components/Navigation";
import DashboardQuestionCard from "@/components/DashboardQuestionCard";
import ResponseViewModal from "@/components/ResponseViewModal";
import { Link } from "wouter";
import {
  ArrowLeft,
  Filter,
  Search,
  Calendar,
  Eye,
  Activity,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import type {
  ChecklistResponse,
  Checklist,
  WorkTask,
  WorkStation,
  Shift,
  Question,
} from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  recentResponses: ChecklistResponse[];
}

interface ChecklistDashboardProps {
  checklistId: string;
}

// Utility function to parse relative dates
function parseRelativeDate(dateStr: string): string {
  if (!dateStr) return "";

  const today = new Date();

  if (dateStr === "t") {
    // Today
    return today.toISOString().split("T")[0];
  } else if (dateStr.startsWith("t-")) {
    // Days ago
    const daysAgo = parseInt(dateStr.substring(2));
    if (!isNaN(daysAgo)) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - daysAgo);
      return targetDate.toISOString().split("T")[0];
    }
  } else if (dateStr.startsWith("t+")) {
    // Days ahead
    const daysAhead = parseInt(dateStr.substring(2));
    if (!isNaN(daysAhead)) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysAhead);
      return targetDate.toISOString().split("T")[0];
    }
  }

  // Return as-is if it's already a date or invalid format
  return dateStr;
}

// Utility function to parse URL search params and set filters
function parseUrlFilters(search: string) {
  const params = new URLSearchParams(search);
  return {
    workTaskId: params.get("workTaskId") || "all",
    workStationId: params.get("workStationId") || "all",
    shiftId: params.get("shiftId") || "all",
    startDate: parseRelativeDate(params.get("startDate") || ""),
    endDate: parseRelativeDate(params.get("endDate") || ""),
    search: params.get("search") || "",
  };
}

// Utility function to update URL with current filters
function updateUrlWithFilters(filters: any, checklistId: string) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value &&
      typeof value === "string" &&
      value.trim() !== "" &&
      value !== "all"
    ) {
      params.set(key, value as string);
    }
  });

  const queryString = params.toString();
  const basePath = `/checklist/${checklistId}/dashboard`;
  const newPath = queryString ? `${basePath}?${queryString}` : basePath;

  // Update URL without navigation
  window.history.replaceState({}, "", newPath);
}

export default function ChecklistDashboard({
  checklistId,
}: ChecklistDashboardProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const id = parseInt(checklistId);

  // Initialize filters from URL parameters
  const [filters, setFilters] = useState(() => {
    const urlParams = new URL(window.location.href).search;
    return parseUrlFilters(urlParams);
  });

  // Response view modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(
    null,
  );

  const [showFilters, setShowFilters] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    updateUrlWithFilters(filters, checklistId);
  }, [filters, checklistId]);

  // Update filters when URL changes (browser back/forward)
  useEffect(() => {
    const urlParams = new URL(window.location.href).search;
    const urlFilters = parseUrlFilters(urlParams);

    // Only update if filters are different to avoid infinite loops
    if (JSON.stringify(urlFilters) !== JSON.stringify(filters)) {
      setFilters(urlFilters);
    }
  }, [location]);

  const { data: checklist } = useQuery<Checklist>({
    queryKey: [`/api/checklists/${id}`],
  });

  // Fetch filter data
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: checklist?.includeWorkTasks,
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: checklist?.includeWorkStations,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: checklist?.includeShifts,
  });

  // Build query parameters for filtering
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("checklistId", id.toString());

    if (filters.workTaskId && filters.workTaskId !== "all")
      params.set("workTaskId", filters.workTaskId);
    if (filters.workStationId && filters.workStationId !== "all")
      params.set("workStationId", filters.workStationId);
    if (filters.shiftId && filters.shiftId !== "all")
      params.set("shiftId", filters.shiftId);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.search) params.set("search", filters.search);

    return params.toString();
  };

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: [`/api/dashboard/stats?${buildQueryParams()}`],
  });

  const { data: responses = [] } = useQuery<ChecklistResponse[]>({
    queryKey: [`/api/responses?${buildQueryParams()}`],
  });

  const { data: dashboardQuestions = [] } = useQuery<Question[]>({
    queryKey: [`/api/dashboard/questions?checklistId=${id}`],
  });

  if (!checklist) {
    return (
        <div className="min-h-screen bg-background text-foreground pb-20">

        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!checklist.hasDashboard) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">

        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="bg-card text-foreground border border-border rounded-xl shadow-sm">
            <CardContent>
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {t("dashboard.dashboardNotEnabled")}
              </h3>
              <p className="text-muted mb-6">
                {t("dashboard.dashboardNotEnabledDescription")}
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("dashboard.backToHome")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-background text-foreground pb-20">

      <Navigation />

      {/* Header */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("dashboard.back")}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {checklist.name}
                </h1>
                <p className="text-sm text-muted-foreground">{t("dashboard.title")}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? "default" : "outline"}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t("common.filter")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar with filters */}
          {showFilters && (
            <div className="w-full lg:w-80 flex-shrink-0">
              <Card className="bg-card text-foreground border border-border rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {t("dashboard.filterOptions")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div>
                    <Label htmlFor="search">
                      {t("dashboard.searchOperator")}
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder={t("dashboard.searchOperatorPlaceholder")}
                        value={filters.search}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            search: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t("dashboard.dateRange")}
                    </Label>
                    <div className="space-y-2">
                      <DatePicker
                        value={filters.startDate}
                        onChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            startDate: value,
                          }))
                        }
                        placeholder={t("dashboard.fromDate")}
                      />
                      <DatePicker
                        value={filters.endDate}
                        onChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            endDate: value,
                          }))
                        }
                        placeholder={t("dashboard.toDate")}
                      />
                    </div>
                  </div>

                  {/* Work Task Filter */}
                  {checklist.includeWorkTasks && (
                    <div>
                      <Label>{t("common.workTask")}</Label>
                      <Select
                        value={filters.workTaskId}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            workTaskId: value,
                            workStationId: "all",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.allWorkTasks")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("common.allWorkTasks")}
                          </SelectItem>
                          {workTasks.map((task) => (
                            <SelectItem
                              key={task.id}
                              value={task.id.toString()}
                            >
                              {task.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Work Station Filter */}
                  {checklist.includeWorkStations && (
                    <div>
                      <Label>{t("common.workStation")}</Label>
                      <Select
                        value={filters.workStationId}
                        onValueChange={(value) =>
                          setFilters((prev) => ({
                            ...prev,
                            workStationId: value,
                          }))
                        }
                        disabled={!filters.workTaskId}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t("common.allWorkStations")}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("common.allWorkStations")}
                          </SelectItem>
                          {workStations
                            .filter(
                              (station) =>
                                filters.workTaskId === "all" ||
                                !filters.workTaskId ||
                                station.workTaskId ===
                                  parseInt(filters.workTaskId),
                            )
                            .map((station) => (
                              <SelectItem
                                key={station.id}
                                value={station.id.toString()}
                              >
                                {station.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Shift Filter */}
                  {checklist.includeShifts && (
                    <div>
                      <Label>{t("common.shift")}</Label>
                      <Select
                        value={filters.shiftId}
                        onValueChange={(value) =>
                          setFilters((prev) => ({ ...prev, shiftId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("common.allShifts")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("common.allShifts")}
                          </SelectItem>
                          {shifts.map((shift) => (
                            <SelectItem
                              key={shift.id}
                              value={shift.id.toString()}
                            >
                              {shift.name} ({shift.startTime}-{shift.endTime})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      setFilters({
                        workTaskId: "all",
                        workStationId: "all",
                        shiftId: "all",
                        startDate: "",
                        endDate: "",
                        search: "",
                      })
                    }
                  >
                    {t("common.clearFilters")}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Statistics Overview - Modern Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="modern-stats-card bg-pastel-blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {stats?.totalResponses || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.totalResponsesFiltered")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {
                        responses.filter((r) => {
                          const responseDate = new Date(r.createdAt);
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          return responseDate >= yesterday;
                        }).length
                      } senaste 24 timmar
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div className="modern-stats-card bg-pastel-green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {
                        Object.values(filters).filter((v) => v && v !== "all").length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.activeFilters")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Nuvarande filter
                    </p>
                  </div>
                  <Filter className="h-8 w-8 text-accent" />
                </div>
              </div>
            </div>


            {/* Dashboard Question Cards */}
            {dashboardQuestions.length > 0 ? (
              <Card className="bg-card text-foreground border border-border rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    {t("dashboard.questionStatistics")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {dashboardQuestions.map((item: any) => {
                      const question = item.questions || item;
                      return (
                        <DashboardQuestionCard
                          key={question.id}
                          question={question}
                          responses={responses}
                          filters={filters}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card text-foreground border border-border rounded-xl shadow-sm">
                <CardContent className="py-12 text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Inga dashboard-frågor konfigurerade
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Recent Responses Table */}
            <Card className="bg-card text-foreground border border-border rounded-xl shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  {t("dashboard.latestResponses")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {responses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-muted text-sm">
                            Operatör
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted text-sm">
                            Datum & Tid
                          </th>
                          <th className="text-left py-3 px-4 font-medium text-muted text-sm">
                            Detaljer
                          </th>
                          <th className="text-right py-3 px-4 font-medium text-muted text-sm">
                            Åtgärd
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.slice(0, 8).map((response, index) => (
                          <tr
                            key={response.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    index % 3 === 0
                                      ? "bg-blue-100 text-blue-700"
                                      : index % 3 === 1
                                        ? "bg-green-100 text-green-700"
                                        : "bg-purple-100 text-purple-700"
                                  }`}
                                >
                                  {response.operatorName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                                <span className="font-medium">
                                  {response.operatorName}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-medium">
                                  {new Date(
                                    response.createdAt,
                                  ).toLocaleDateString("sv-SE")}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(
                                    response.createdAt,
                                  ).toLocaleTimeString("sv-SE", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-wrap gap-1">
                                {response.workTaskId && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                    {workTasks.find(
                                      (wt) => wt.id === response.workTaskId,
                                    )?.name || `ID: ${response.workTaskId}`}
                                  </span>
                                )}
                                {response.workStationId && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                    {workStations.find(
                                      (ws) => ws.id === response.workStationId,
                                    )?.name || `ID: ${response.workStationId}`}
                                  </span>
                                )}
                                {response.shiftId && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                                    {shifts.find(
                                      (s) => s.id === response.shiftId,
                                    )?.name || `ID: ${response.shiftId}`}
                                  </span>
                                )}
                                {!response.workTaskId &&
                                  !response.workStationId &&
                                  !response.shiftId && (
                                    <span className="text-xs text-gray-400">
                                      Inga detaljer
                                    </span>
                                  )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedResponseId(response.id);
                                  setViewModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Visa
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {t("dashboard.noResponsesYet")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ResponseViewModal
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedResponseId(null);
        }}
        responseId={selectedResponseId}
      />
    </div>
  );
}

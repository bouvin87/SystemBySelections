import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import DashboardQuestionCard from "@/components/DashboardQuestionCard";
import ResponseViewModal from "@/components/ResponseViewModal";
import { Link } from "wouter";
import { ArrowLeft, Filter, Search, Calendar, Eye } from "lucide-react";
import { useState } from "react";
import { useTranslation } from 'react-i18next';
import type { ChecklistResponse, Checklist, WorkTask, WorkStation, Shift, Question } from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  recentResponses: ChecklistResponse[];
}

interface ChecklistDashboardProps {
  checklistId: string;
}

export default function ChecklistDashboard({ checklistId }: ChecklistDashboardProps) {
  const { t } = useTranslation();
  const id = parseInt(checklistId);
  
  // Filter state
  const [filters, setFilters] = useState({
    workTaskId: "all",
    workStationId: "all",
    shiftId: "all",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Response view modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);

  const [showFilters, setShowFilters] = useState(false);

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
    params.set('checklistId', id.toString());
    
    if (filters.workTaskId && filters.workTaskId !== "all") params.set('workTaskId', filters.workTaskId);
    if (filters.workStationId && filters.workStationId !== "all") params.set('workStationId', filters.workStationId);
    if (filters.shiftId && filters.shiftId !== "all") params.set('shiftId', filters.shiftId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.search) params.set('search', filters.search);
    
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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!checklist.hasDashboard) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('dashboard.dashboardNotEnabled')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('dashboard.dashboardNotEnabledDescription')}
              </p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('dashboard.backToHome')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('dashboard.back')}
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {checklist.name}
                </h1>
                <p className="text-sm text-gray-600">{t('dashboard.title')}</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowFilters(!showFilters)} 
              variant={showFilters ? "default" : "outline"}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar with filters */}
          {showFilters && (
            <div className="w-80 flex-shrink-0">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    {t('dashboard.filterOptions')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search */}
                  <div>
                    <Label htmlFor="search">{t('dashboard.searchOperator')}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="search"
                        placeholder={t('dashboard.searchOperatorPlaceholder')}
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t('dashboard.dateRange')}
                    </Label>
                    <div className="space-y-2">
                      <Input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        placeholder={t('dashboard.fromDate')}
                      />
                      <Input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        placeholder={t('dashboard.toDate')}
                      />
                    </div>
                  </div>

                  {/* Work Task Filter */}
                  {checklist.includeWorkTasks && (
                    <div>
                      <Label>{t('common.workTask')}</Label>
                      <Select
                        value={filters.workTaskId}
                        onValueChange={(value) => setFilters(prev => ({ 
                          ...prev, 
                          workTaskId: value,
                          workStationId: "all"
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.allWorkTasks')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.allWorkTasks')}</SelectItem>
                          {workTasks.map((task) => (
                            <SelectItem key={task.id} value={task.id.toString()}>
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
                      <Label>{t('common.workStation')}</Label>
                      <Select
                        value={filters.workStationId}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, workStationId: value }))}
                        disabled={!filters.workTaskId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.allWorkStations')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.allWorkStations')}</SelectItem>
                          {workStations
                            .filter(station => filters.workTaskId === "all" || !filters.workTaskId || station.workTaskId === parseInt(filters.workTaskId))
                            .map((station) => (
                              <SelectItem key={station.id} value={station.id.toString()}>
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
                      <Label>{t('common.shift')}</Label>
                      <Select
                        value={filters.shiftId}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, shiftId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('common.allShifts')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('common.allShifts')}</SelectItem>
                          {shifts.map((shift) => (
                            <SelectItem key={shift.id} value={shift.id.toString()}>
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
                    onClick={() => setFilters({
                      workTaskId: "all",
                      workStationId: "all",
                      shiftId: "all",
                      startDate: "",
                      endDate: "",
                      search: "",
                    })}
                  >
                    {t('common.clearFilters')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 space-y-8">
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {t('dashboard.totalResponsesFiltered')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalResponses || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {t('dashboard.activeFilters')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {Object.values(filters).filter(v => v && v !== "all").length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {t('dashboard.questionsTracked')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{dashboardQuestions.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Question Cards */}
            {dashboardQuestions.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                  {t('dashboard.questionStatistics')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              </div>
            )}

            {/* Recent Responses */}
            <div>
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                {t('dashboard.latestResponses')}
              </h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {responses.slice(0, 10).map((response, index) => (
                      <div key={response.id} className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{response.operatorName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(response.createdAt).toLocaleDateString('sv-SE')} • {new Date(response.createdAt).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedResponseId(response.id);
                            setViewModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('common.view')}
                        </Button>
                      </div>
                    ))}
                    {responses.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <Eye className="h-12 w-12 mx-auto" />
                        </div>
                        <p className="text-gray-500">{t('dashboard.noResponsesYet')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
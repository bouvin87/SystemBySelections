import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import FormModal from "@/components/FormModal";
import { CheckCircle, Star, Settings, Clock, Plus, TrendingUp } from "lucide-react";
import { type ChecklistResponse } from "@shared/schema";

interface DashboardStats {
  totalResponses: number;
  completedResponses: number;
  recentResponses: ChecklistResponse[];
}

export default function Dashboard() {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [shiftFilter, setShiftFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("7");

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: responses = [], isLoading: responsesLoading } = useQuery<ChecklistResponse[]>({
    queryKey: ["/api/responses", { limit: 10 }],
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `För ${diffInMinutes} min sedan`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `För ${hours} h sedan`;
    } else {
      return date.toLocaleDateString('sv-SE');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header with Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-2xl font-medium text-gray-900">Dashboard</h2>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-3">
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla skift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla skift</SelectItem>
                <SelectItem value="day">Dag (06:00-14:00)</SelectItem>
                <SelectItem value="evening">Kväll (14:00-22:00)</SelectItem>
                <SelectItem value="night">Natt (22:00-06:00)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Senaste 7 dagarna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Senaste 7 dagarna</SelectItem>
                <SelectItem value="30">Senaste 30 dagarna</SelectItem>
                <SelectItem value="month">Denna månad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="material-shadow-1 hover:material-shadow-2 transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Genomförda kontroller</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {statsLoading ? "-" : stats?.completedResponses || 0}
                  </p>
                </div>
                <div className="p-3 bg-primary bg-opacity-10 rounded-full">
                  <CheckCircle className="text-primary text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-success mr-1" />
                <span className="text-success text-sm font-medium">+12%</span>
                <span className="text-gray-600 text-sm ml-1">från förra veckan</span>
              </div>
            </CardContent>
          </Card>

          <Card className="material-shadow-1 hover:material-shadow-2 transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Genomsnittlig rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">4.2</p>
                </div>
                <div className="p-3 bg-accent bg-opacity-10 rounded-full">
                  <Star className="text-accent text-xl" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex text-accent">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= 4 ? "fill-current" : ""}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="material-shadow-1 hover:material-shadow-2 transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktiva stationer</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">8/12</p>
                </div>
                <div className="p-3 bg-success bg-opacity-10 rounded-full">
                  <Settings className="text-success text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div className="bg-success h-2 rounded-full" style={{ width: "67%" }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="material-shadow-1 hover:material-shadow-2 transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Senaste kontroll</p>
                  <p className="text-lg font-medium text-gray-900 mt-2">
                    {responsesLoading ? "-" : responses.length > 0 ? formatTimeAgo(responses[0].createdAt) : "Ingen data"}
                  </p>
                </div>
                <div className="p-3 bg-secondary bg-opacity-10 rounded-full">
                  <Clock className="text-secondary text-xl" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">
                  {responsesLoading ? "-" : responses.length > 0 ? responses[0].operatorName : "Ingen data"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Submissions */}
        <Card className="material-shadow-1">
          <CardHeader>
            <CardTitle>Senaste kontroller</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200">
              {responsesLoading ? (
                <div className="px-6 py-4 text-center text-gray-500">Laddar...</div>
              ) : responses.length === 0 ? (
                <div className="px-6 py-4 text-center text-gray-500">Inga kontroller ännu</div>
              ) : (
                responses.map((response) => (
                  <div key={response.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              response.isCompleted ? "bg-success" : "bg-warning"
                            }`}>
                              <CheckCircle className="text-white text-sm" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              Kontroll #{response.id}
                            </p>
                            <p className="text-sm text-gray-600">
                              {response.operatorName}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm text-gray-900">
                          {new Date(response.createdAt).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(response.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        <Button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full material-shadow-3 hover:material-shadow-2 transition-all duration-200 hover:scale-105"
          onClick={() => setFormModalOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* Form Modal */}
        <FormModal 
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
        />
      </main>
    </div>
  );
}

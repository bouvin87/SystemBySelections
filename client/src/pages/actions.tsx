import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Edit,
  Trash2
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ActionItem, ActionComment, WorkTask, WorkStation } from "@shared/schema";

interface ActionUser {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
}

interface ActionStats {
  total: number;
  new: number;
  inProgress: number;
  done: number;
  overdue: number;
  highPriority: number;
}

export default function Actions() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "new" as const,
    priority: "medium" as const,
    dueDate: "",
    assignedToUserId: "",
    workTaskId: "",
    locationId: "",
  });

  const [commentText, setCommentText] = useState("");

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedToUserId: "",
    workTaskId: "",
    search: "",
  });

  // Fetch action statistics
  const { data: stats } = useQuery<ActionStats>({
    queryKey: ["/api/actions/stats"],
  });

  // Fetch action items with filters
  const { data: actions = [], isLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/actions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      if (activeTab !== "all") {
        params.set("status", activeTab);
      }
      const response = await apiRequest("GET", `/api/actions?${params.toString()}`);
      return response.json();
    },
  });

  // Fetch comments for selected action
  const { data: comments = [] } = useQuery<ActionComment[]>({
    queryKey: ["/api/actions", selectedAction?.id, "comments"],
    queryFn: async () => {
      if (!selectedAction) return [];
      const response = await apiRequest("GET", `/api/actions/${selectedAction.id}/comments`);
      return response.json();
    },
    enabled: !!selectedAction,
  });

  // Fetch reference data
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const { data: users = [] } = useQuery<ActionUser[]>({
    queryKey: ["/api/users"],
  });

  // Create action mutation
  const createActionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/actions", data);
    },
    onSuccess: () => {
      toast({
        title: "Åtgärd skapad",
        description: "Åtgärden har skapats framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa åtgärden. Försök igen.",
        variant: "destructive",
      });
    },
  });

  // Update action mutation
  const updateActionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest("PATCH", `/api/actions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Åtgärd uppdaterad",
        description: "Åtgärden har uppdaterats framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/actions"] });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera åtgärden. Försök igen.",
        variant: "destructive",
      });
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ actionId, comment }: { actionId: number; comment: string }) => {
      return apiRequest("POST", `/api/actions/${actionId}/comments`, { comment });
    },
    onSuccess: () => {
      toast({
        title: "Kommentar tillagd",
        description: "Din kommentar har lagts till.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/actions", selectedAction?.id, "comments"] });
      setCommentText("");
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kommentaren. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      status: "new",
      priority: "medium",
      dueDate: "",
      assignedToUserId: "",
      workTaskId: "",
      locationId: "",
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createActionMutation.mutate({
      ...formData,
      assignedToUserId: formData.assignedToUserId ? parseInt(formData.assignedToUserId) : null,
      workTaskId: formData.workTaskId ? parseInt(formData.workTaskId) : null,
      locationId: formData.locationId ? parseInt(formData.locationId) : null,
      dueDate: formData.dueDate || null,
    });
  };

  const handleStatusUpdate = (action: ActionItem, newStatus: string) => {
    updateActionMutation.mutate({
      id: action.id,
      data: { status: newStatus },
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAction || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      actionId: selectedAction.id,
      comment: commentText.trim(),
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "done": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "new": return "Ny";
      case "in_progress": return "Pågående";
      case "done": return "Klar";
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "critical": return "Kritisk";
      case "high": return "Hög";
      case "medium": return "Medium";
      case "low": return "Låg";
      default: return priority;
    }
  };

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
                  Tillbaka
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                  Åtgärder
                </h1>
                <p className="text-gray-600 mt-2">
                  Hantera avvikelser och uppföljningar
                </p>
              </div>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Skapa åtgärd
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Totalt</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Nya</p>
                    <p className="text-2xl font-bold">{stats.new}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pågående</p>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                  </div>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Klara</p>
                    <p className="text-2xl font-bold">{stats.done}</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Försenade</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                  </div>
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Hög prioritet</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Tabs */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">Alla ({stats?.total || 0})</TabsTrigger>
                <TabsTrigger value="new">Nya ({stats?.new || 0})</TabsTrigger>
                <TabsTrigger value="in_progress">Pågående ({stats?.inProgress || 0})</TabsTrigger>
                <TabsTrigger value="done">Klara ({stats?.done || 0})</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Prioritet</Label>
                <Select value={filters.priority} onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla prioriteter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alla prioriteter</SelectItem>
                    <SelectItem value="critical">Kritisk</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Låg</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ansvarig</Label>
                <Select value={filters.assignedToUserId} onValueChange={(value) => setFilters(prev => ({ ...prev, assignedToUserId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla användare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alla användare</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Arbetsmoment</Label>
                <Select value={filters.workTaskId} onValueChange={(value) => setFilters(prev => ({ ...prev, workTaskId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alla arbetsmoment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Alla arbetsmoment</SelectItem>
                    {workTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Sök</Label>
                <Input
                  placeholder="Sök åtgärder..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Items List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-600">Laddar åtgärder...</p>
              </CardContent>
            </Card>
          ) : actions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Inga åtgärder hittades</p>
              </CardContent>
            </Card>
          ) : (
            actions.map((action) => (
              <Card key={action.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {action.title}
                        </h3>
                        <Badge className={getPriorityColor(action.priority)}>
                          {getPriorityText(action.priority)}
                        </Badge>
                        <Badge className={getStatusColor(action.status)}>
                          {getStatusText(action.status)}
                        </Badge>
                      </div>
                      
                      {action.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {action.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Skapad: {new Date(action.createdAt).toLocaleDateString('sv-SE')}
                        </span>
                        {action.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Förfaller: {new Date(action.dueDate).toLocaleDateString('sv-SE')}
                          </span>
                        )}
                        {action.assignedToUserId && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Ansvarig: {users.find(u => u.id === action.assignedToUserId)?.firstName || 'Okänd'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {action.status !== 'done' && (
                        <Select value={action.status} onValueChange={(value) => handleStatusUpdate(action, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Ny</SelectItem>
                            <SelectItem value="in_progress">Pågående</SelectItem>
                            <SelectItem value="done">Klar</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAction(action);
                          setIsDetailsModalOpen(true);
                        }}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Detaljer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Create Action Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Skapa ny åtgärd</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Kort beskrivning av åtgärden"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detaljerad beskrivning av avvikelsen och åtgärden"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioritet</Label>
                <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Låg</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                    <SelectItem value="critical">Kritisk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="dueDate">Förfallodatum</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="assignedTo">Tilldela till</Label>
                <Select value={formData.assignedToUserId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToUserId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ansvarig" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="workTask">Arbetsmoment</Label>
                <Select value={formData.workTaskId} onValueChange={(value) => setFormData(prev => ({ ...prev, workTaskId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj arbetsmoment" />
                  </SelectTrigger>
                  <SelectContent>
                    {workTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Plats/Station</Label>
              <Select value={formData.locationId} onValueChange={(value) => setFormData(prev => ({ ...prev, locationId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj plats" />
                </SelectTrigger>
                <SelectContent>
                  {workStations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createActionMutation.isPending}>
              {createActionMutation.isPending ? 'Skapar...' : 'Skapa åtgärd'}
            </Button>
          </div>
        </form>
        </DialogContent>
      </Dialog>

      {/* Action Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Åtgärdsdetaljer</DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-6">
              {/* Action Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{selectedAction.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityColor(selectedAction.priority)}>
                        {getPriorityText(selectedAction.priority)}
                      </Badge>
                      <Badge className={getStatusColor(selectedAction.status)}>
                        {getStatusText(selectedAction.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {selectedAction.description && (
                  <p className="text-gray-700 mb-4">{selectedAction.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Skapad:</span> {new Date(selectedAction.createdAt).toLocaleString('sv-SE')}
                  </div>
                  <div>
                    <span className="font-medium">Senast uppdaterad:</span> {new Date(selectedAction.updatedAt).toLocaleString('sv-SE')}
                  </div>
                  {selectedAction.dueDate && (
                    <div>
                      <span className="font-medium">Förfaller:</span> {new Date(selectedAction.dueDate).toLocaleDateString('sv-SE')}
                    </div>
                  )}
                  {selectedAction.assignedToUserId && (
                    <div>
                      <span className="font-medium">Ansvarig:</span> {users.find(u => u.id === selectedAction.assignedToUserId)?.firstName || 'Okänd'}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comments Section */}
              <div>
                <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Kommentarer ({comments.length})
                </h4>
                
                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mb-6">
                  <div className="flex gap-3">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Lägg till en kommentar..."
                      rows={2}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={!commentText.trim() || addCommentMutation.isPending}>
                      {addCommentMutation.isPending ? 'Skickar...' : 'Skicka'}
                    </Button>
                  </div>
                </form>
                
                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Inga kommentarer än</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="bg-white p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {users.find(u => u.id === comment.userId)?.firstName || 'Okänd användare'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleString('sv-SE')}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
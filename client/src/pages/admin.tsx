import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  Checklist,
  InsertChecklist,
  WorkTask,
  InsertWorkTask,
  WorkStation,
  InsertWorkStation,
  Shift,
  InsertShift,
} from "@shared/schema";
import Navigation from "@/components/Navigation";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("checklists");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  // Queries
  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
    enabled: activeTab === "checklists",
  });

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: activeTab === "basic-data",
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: activeTab === "basic-data",
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: activeTab === "shifts",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest(endpoint, "POST", data);
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Sparat!", description: "Objektet har skapats." });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara objektet.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: number; data: any }) => {
      return apiRequest(`${endpoint}/${id}`, "PATCH", data);
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Uppdaterat!", description: "Objektet har uppdaterats." });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera objektet.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: number }) => {
      return apiRequest(`${endpoint}/${id}`, "DELETE");
    },
    onSuccess: (_, { endpoint }) => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({ title: "Borttaget!", description: "Objektet har tagits bort." });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort objektet.",
        variant: "destructive",
      });
    },
  });

  const openDialog = (item?: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleSubmit = (endpoint: string, data: any) => {
    if (editingItem) {
      updateMutation.mutate({ endpoint, id: editingItem.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  const handleDelete = (endpoint: string, id: number) => {
    if (confirm("Är du säker på att du vill ta bort detta objekt?")) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="checklists">Checklistor</TabsTrigger>
                <TabsTrigger value="shifts">Skift</TabsTrigger>
                <TabsTrigger value="basic-data">Grunddata</TabsTrigger>
              </TabsList>

              {/* Checklists Tab */}
              <TabsContent value="checklists">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Hantera checklistor</h3>
                  <Dialog open={dialogOpen && activeTab === "checklists"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ny checklista
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Redigera checklista" : "Ny checklista"}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertChecklist = {
                            name: formData.get("name") as string,
                            description: formData.get("description") as string || undefined,
                            includeWorkTasks: formData.get("includeWorkTasks") === "on",
                            includeWorkStations: formData.get("includeWorkStations") === "on",
                            includeShifts: formData.get("includeShifts") === "on",
                            isActive: formData.get("isActive") === "on",
                            order: parseInt(formData.get("order") as string) || 0,
                          };
                          handleSubmit("/api/checklists", data);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="name">Namn</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingItem?.name || ""}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Beskrivning</Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={editingItem?.description || ""}
                          />
                        </div>
                        <div>
                          <Label htmlFor="order">Ordning</Label>
                          <Input
                            id="order"
                            name="order"
                            type="number"
                            defaultValue={editingItem?.order || 0}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeWorkTasks"
                            name="includeWorkTasks"
                            defaultChecked={editingItem?.includeWorkTasks ?? true}
                          />
                          <Label htmlFor="includeWorkTasks">Inkludera arbetsmoment</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeWorkStations"
                            name="includeWorkStations"
                            defaultChecked={editingItem?.includeWorkStations ?? true}
                          />
                          <Label htmlFor="includeWorkStations">Inkludera stationer</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeShifts"
                            name="includeShifts"
                            defaultChecked={editingItem?.includeShifts ?? true}
                          />
                          <Label htmlFor="includeShifts">Inkludera skift</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            name="isActive"
                            defaultChecked={editingItem?.isActive ?? true}
                          />
                          <Label htmlFor="isActive">Aktiv</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          Spara
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-4">
                  {checklists.map((checklist) => (
                    <Card key={checklist.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{checklist.name}</h4>
                            {checklist.description && (
                              <p className="text-sm text-gray-600">{checklist.description}</p>
                            )}
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <Badge variant={checklist.isActive ? "default" : "secondary"}>
                                {checklist.isActive ? "Aktiv" : "Inaktiv"}
                              </Badge>
                              {checklist.includeWorkTasks && <span>Arbetsmoment</span>}
                              {checklist.includeWorkStations && <span>Stationer</span>}
                              {checklist.includeShifts && <span>Skift</span>}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.location.href = `/admin/checklist/${checklist.id}`;
                              }}
                            >
                              <Settings className="mr-1 h-3 w-3" />
                              Hantera
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(checklist)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("/api/checklists", checklist.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Shifts Tab */}
              <TabsContent value="shifts">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Hantera skift</h3>
                  <Dialog open={dialogOpen && activeTab === "shifts"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nytt skift
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Redigera skift" : "Nytt skift"}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertShift = {
                            name: formData.get("name") as string,
                            startTime: formData.get("startTime") as string,
                            endTime: formData.get("endTime") as string,
                            isActive: formData.get("isActive") === "on",
                          };
                          handleSubmit("/api/shifts", data);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="name">Namn</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingItem?.name || ""}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startTime">Starttid</Label>
                            <Input
                              id="startTime"
                              name="startTime"
                              type="time"
                              defaultValue={editingItem?.startTime || ""}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="endTime">Sluttid</Label>
                            <Input
                              id="endTime"
                              name="endTime"
                              type="time"
                              defaultValue={editingItem?.endTime || ""}
                              required
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            name="isActive"
                            defaultChecked={editingItem?.isActive ?? true}
                          />
                          <Label htmlFor="isActive">Aktiv</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          Spara
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="space-y-4">
                  {shifts.map((shift) => (
                    <Card key={shift.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{shift.name}</h4>
                            <p className="text-sm text-gray-600">
                              {shift.startTime} - {shift.endTime}
                            </p>
                            <div className="mt-2">
                              <Badge variant={shift.isActive ? "default" : "secondary"}>
                                {shift.isActive ? "Aktiv" : "Inaktiv"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(shift)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("/api/shifts", shift.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Basic Data Tab */}
              <TabsContent value="basic-data">
                <div className="space-y-8">
                  {/* Work Tasks Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Arbetsmoment</h3>
                      <Dialog open={dialogOpen && activeTab === "basic-data"} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nytt arbetsmoment
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? "Redigera arbetsmoment" : "Nytt arbetsmoment"}
                            </DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const data: InsertWorkTask = {
                                name: formData.get("name") as string,
                                hasStations: formData.get("hasStations") === "on",
                              };
                              handleSubmit("/api/work-tasks", data);
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="name">Namn</Label>
                              <Input
                                id="name"
                                name="name"
                                defaultValue={editingItem?.name || ""}
                                required
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="hasStations"
                                name="hasStations"
                                defaultChecked={editingItem?.hasStations ?? false}
                              />
                              <Label htmlFor="hasStations">Har stationer</Label>
                            </div>
                            <Button type="submit" className="w-full">
                              <Save className="mr-2 h-4 w-4" />
                              Spara
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-4">
                      {workTasks.map((task) => (
                        <Card key={task.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{task.name}</h4>
                                <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                  {task.hasStations && <Badge variant="outline">Har stationer</Badge>}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(task)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete("/api/work-tasks", task.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Work Stations Section */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Arbetsstationer</h3>
                    <div className="space-y-4">
                      {workStations.map((station) => (
                        <Card key={station.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{station.name}</h4>
                                <p className="text-xs text-gray-500">
                                  Arbetsmoment: {workTasks.find(t => t.id === station.workTaskId)?.name || 'Okänt'}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete("/api/work-stations", station.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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
import { useTranslation } from 'react-i18next';
import IconPicker from "@/components/IconPicker";
import { renderIcon } from "@/lib/icon-utils";
import LanguageSelector from "@/components/LanguageSelector";
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
  const [basicDataTab, setBasicDataTab] = useState("work-tasks");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const { toast } = useToast();
  const { t } = useTranslation();

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
    enabled: activeTab === "basic-data",
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/all-active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setDialogOpen(false);
      setEditingItem(null);
      setSelectedIcon("");
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
      return apiRequest("PATCH", `${endpoint}/${id}`, data);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/all-active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
      setDialogOpen(false);
      setEditingItem(null);
      setSelectedIcon("");
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
      return apiRequest("DELETE", `${endpoint}/${id}`);
    },
    onSuccess: (_, { endpoint }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/checklists/all-active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-stations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shifts"] });
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
    setSelectedIcon(item?.icon || "");
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
    if (confirm(t('admin.confirmDelete'))) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="checklists">{t('admin.checklists')}</TabsTrigger>
                <TabsTrigger value="basic-data">{t('admin.basicData')}</TabsTrigger>
                <TabsTrigger value="settings">{t('admin.settings')}</TabsTrigger>
              </TabsList>

              {/* Checklists Tab */}
              <TabsContent value="checklists">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">{t('admin.manage')} {t('admin.checklists').toLowerCase()}</h3>
                  <Dialog open={dialogOpen && activeTab === "checklists"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('admin.add')} {t('admin.checklist').toLowerCase()}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? t('admin.edit') + " " + t('admin.checklists').toLowerCase() : t('admin.add') + " " + t('admin.checklists').toLowerCase()}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertChecklist = {
                            name: formData.get("name") as string,
                            description: formData.get("description") as string || undefined,
                            icon: selectedIcon || undefined,
                            includeWorkTasks: formData.get("includeWorkTasks") === "on",
                            includeWorkStations: formData.get("includeWorkStations") === "on",
                            includeShifts: formData.get("includeShifts") === "on",
                            isActive: formData.get("isActive") === "on",
                            showInMenu: formData.get("showInMenu") === "on",
                            hasDashboard: formData.get("hasDashboard") === "on",
                            order: parseInt(formData.get("order") as string) || 0,
                          };
                          handleSubmit("/api/checklists", data);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="name">{t('admin.name')}</Label>
                          <Input
                            id="name"
                            name="name"
                            defaultValue={editingItem?.name || ""}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">{t('admin.description')}</Label>
                          <Textarea
                            id="description"
                            name="description"
                            defaultValue={editingItem?.description || ""}
                          />
                        </div>
                        <IconPicker
                          value={selectedIcon}
                          onChange={setSelectedIcon}
                          placeholder={t('admin.selectIcon')}
                        />
                        <div>
                          <Label htmlFor="order">{t('admin.order')}</Label>
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
                          <Label htmlFor="includeWorkTasks">{t('admin.includeWorkTasks')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeWorkStations"
                            name="includeWorkStations"
                            defaultChecked={editingItem?.includeWorkStations ?? true}
                          />
                          <Label htmlFor="includeWorkStations">{t('admin.includeWorkStations')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="includeShifts"
                            name="includeShifts"
                            defaultChecked={editingItem?.includeShifts ?? true}
                          />
                          <Label htmlFor="includeShifts">{t('admin.includeShifts')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isActive"
                            name="isActive"
                            defaultChecked={editingItem?.isActive ?? true}
                          />
                          <Label htmlFor="isActive">{t('admin.active')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showInMenu"
                            name="showInMenu"
                            defaultChecked={editingItem?.showInMenu ?? false}
                          />
                          <Label htmlFor="showInMenu">{t('admin.showInMenu')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hasDashboard"
                            name="hasDashboard"
                            defaultChecked={editingItem?.hasDashboard ?? false}
                          />
                          <Label htmlFor="hasDashboard">{t('admin.hasDashboard')}</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          {t('admin.save')}
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
                            <div className="flex items-center gap-2">
                              {renderIcon(checklist.icon, "h-4 w-4 text-gray-600")}
                              <h4 className="text-sm font-medium text-gray-900">{checklist.name}</h4>
                            </div>
                            {checklist.description && (
                              <p className="text-sm text-gray-600">{checklist.description}</p>
                            )}
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <Badge variant={checklist.isActive ? "default" : "secondary"}>
                                {checklist.isActive ? t('admin.active') : t('admin.inactive')}
                              </Badge>
                              {checklist.includeWorkTasks && <span>{t('admin.workTasks')}</span>}
                              {checklist.includeWorkStations && <span>{t('admin.workStations')}</span>}
                              {checklist.includeShifts && <span>{t('admin.shifts')}</span>}
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
                              {t('admin.manage')}
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

              {/* Basic Data Tab */}
              <TabsContent value="basic-data">
                <Tabs value={basicDataTab} onValueChange={setBasicDataTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="work-tasks">{t('admin.workTasks')}</TabsTrigger>
                    <TabsTrigger value="work-stations">{t('admin.workStations')}</TabsTrigger>
                    <TabsTrigger value="shifts">{t('admin.shifts')}</TabsTrigger>
                  </TabsList>

                  {/* Work Tasks Tab */}
                  <TabsContent value="work-tasks">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t('admin.manage')} {t('admin.workTasks').toLowerCase()}</h3>
                      <Dialog open={dialogOpen && activeTab === "basic-data" && basicDataTab === "work-tasks"} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.add')} {t('admin.workTask').toLowerCase()}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? t('admin.edit') + " " + t('admin.workTask').toLowerCase() : t('admin.add') + " " + t('admin.workTask').toLowerCase()}
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
                              <Label htmlFor="name">{t('admin.name')}</Label>
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
                              <Label htmlFor="hasStations">{t('admin.hasStations')}</Label>
                            </div>
                            <Button type="submit" className="w-full">
                              <Save className="mr-2 h-4 w-4" />
                              {t('admin.save')}
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
                                  {task.hasStations && <Badge variant="outline">{t('admin.hasStations')}</Badge>}
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
                  </TabsContent>

                  {/* Work Stations Tab */}
                  <TabsContent value="work-stations">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t('admin.manage')} {t('admin.workStations').toLowerCase()}</h3>
                      <Dialog open={dialogOpen && activeTab === "basic-data" && basicDataTab === "work-stations"} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.add')} {t('admin.workStation').toLowerCase()}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? t('admin.edit') + " " + t('admin.workStation').toLowerCase() : t('admin.add') + " " + t('admin.workStation').toLowerCase()}
                            </DialogTitle>
                          </DialogHeader>
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const data: InsertWorkStation = {
                                name: formData.get("name") as string,
                                workTaskId: parseInt(formData.get("workTaskId") as string),
                              };
                              handleSubmit("/api/work-stations", data);
                            }}
                            className="space-y-4"
                          >
                            <div>
                              <Label htmlFor="name">{t('admin.name')}</Label>
                              <Input
                                id="name"
                                name="name"
                                defaultValue={editingItem?.name || ""}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="workTaskId">{t('admin.workTask')}</Label>
                              <select
                                id="workTaskId"
                                name="workTaskId"
                                className="w-full p-2 border border-gray-300 rounded-md"
                                defaultValue={editingItem?.workTaskId || ""}
                                required
                              >
                                <option value="">{t('admin.selectWorkTask')}</option>
                                {workTasks.map((task) => (
                                  <option key={task.id} value={task.id}>
                                    {task.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button type="submit" className="w-full">
                              <Save className="mr-2 h-4 w-4" />
                              {t('admin.save')}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="space-y-4">
                      {workStations.map((station) => (
                        <Card key={station.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{station.name}</h4>
                                <p className="text-xs text-gray-500">
                                  {t('admin.workTask')}: {workTasks.find(t => t.id === station.workTaskId)?.name || t('common.unknown')}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDialog(station)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
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
                  </TabsContent>

                  {/* Shifts Tab */}
                  <TabsContent value="shifts">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">{t('admin.manage')} {t('admin.shifts').toLowerCase()}</h3>
                      <Dialog open={dialogOpen && activeTab === "basic-data" && basicDataTab === "shifts"} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => openDialog()}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('admin.add')} {t('admin.shift').toLowerCase()}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? t('admin.edit') + " " + t('admin.shift').toLowerCase() : t('admin.add') + " " + t('admin.shift').toLowerCase()}
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
                              <Label htmlFor="name">{t('admin.name')}</Label>
                              <Input
                                id="name"
                                name="name"
                                defaultValue={editingItem?.name || ""}
                                required
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="startTime">{t('admin.startTime')}</Label>
                                <Input
                                  id="startTime"
                                  name="startTime"
                                  type="time"
                                  defaultValue={editingItem?.startTime || ""}
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="endTime">{t('admin.endTime')}</Label>
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
                              <Label htmlFor="isActive">{t('admin.active')}</Label>
                            </div>
                            <Button type="submit" className="w-full">
                              <Save className="mr-2 h-4 w-4" />
                              {t('admin.save')}
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
                </Tabs>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings">
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">{t('admin.settings')}</h3>
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('admin.language')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <LanguageSelector />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
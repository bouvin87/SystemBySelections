import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/Navigation";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save } from "lucide-react";
import { 
  type Checklist, type Question, type Category, type WorkTask, type WorkStation, type Shift,
  type InsertChecklist, type InsertQuestion, type InsertCategory, type InsertWorkTask, type InsertWorkStation, type InsertShift
} from "@shared/schema";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("checklists");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Queries
  const { data: checklists = [] } = useQuery<Checklist[]>({ queryKey: ["/api/checklists"] });
  const { data: questions = [] } = useQuery<Question[]>({ queryKey: ["/api/questions"] });
  const { data: categories = [] } = useQuery<Category[]>({ queryKey: ["/api/categories"] });
  const { data: workTasks = [] } = useQuery<WorkTask[]>({ queryKey: ["/api/work-tasks"] });
  const { data: workStations = [] } = useQuery<WorkStation[]>({ queryKey: ["/api/work-stations"] });
  const { data: shifts = [] } = useQuery<Shift[]>({ queryKey: ["/api/shifts"] });

  // Generic mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create item");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Skapat!", description: "Objektet har skapats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.endpoint.split('/')[0]}`] });
      setDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Fel", description: "Kunde inte skapa objektet.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ endpoint, id, data }: { endpoint: string; id: number; data: any }) => {
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update item");
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Uppdaterat!", description: "Objektet har uppdaterats framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.endpoint.split('/')[0]}`] });
      setDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => {
      toast({ title: "Fel", description: "Kunde inte uppdatera objektet.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ endpoint, id }: { endpoint: string; id: number }) => {
      const response = await fetch(`/api/${endpoint}/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete item");
    },
    onSuccess: (_, variables) => {
      toast({ title: "Raderat!", description: "Objektet har raderats." });
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.endpoint.split('/')[0]}`] });
    },
    onError: () => {
      toast({ title: "Fel", description: "Kunde inte radera objektet.", variant: "destructive" });
    },
  });

  const handleSubmit = (endpoint: string, data: any) => {
    if (editingItem?.id) {
      updateMutation.mutate({ endpoint, id: editingItem.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  const handleDelete = (endpoint: string, id: number) => {
    if (confirm("Är du säker på att du vill radera detta objekt?")) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  const openDialog = (item: any = null) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const QuestionTypeLabel = ({ type }: { type: string }) => {
    const labels: Record<string, string> = {
      checkbox: "Kryssruta",
      radio: "Alternativ",
      text: "Text",
      rating: "Betyg",
      mood: "Humör",
      number: "Nummer",
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="material-shadow-1">
          <CardHeader>
            <CardTitle>Administration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="checklists">Checklistor</TabsTrigger>
                <TabsTrigger value="questions">Frågor</TabsTrigger>
                <TabsTrigger value="categories">Kategorier</TabsTrigger>
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
                            isActive: formData.get("isActive") === "on",
                            order: parseInt(formData.get("order") as string) || 0,
                          };
                          handleSubmit("checklists", data);
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
                            </div>
                          </div>
                          <div className="flex space-x-2">
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
                              onClick={() => handleDelete("checklists", checklist.id)}
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

              {/* Questions Tab */}
              <TabsContent value="questions">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Hantera frågor</h3>
                  <Dialog open={dialogOpen && activeTab === "questions"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ny fråga
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Redigera fråga" : "Ny fråga"}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertQuestion = {
                            text: formData.get("text") as string,
                            type: formData.get("type") as string,
                            categoryId: parseInt(formData.get("categoryId") as string) || null,
                            workTaskId: parseInt(formData.get("workTaskId") as string) || null,
                            showInDashboard: formData.get("showInDashboard") === "on",
                            dashboardDisplayType: formData.get("dashboardDisplayType") as string || null,
                            order: parseInt(formData.get("order") as string) || 0,
                            isRequired: formData.get("isRequired") === "on",
                            options: formData.get("options") ? JSON.parse(formData.get("options") as string) : null,
                          };
                          handleSubmit("questions", data);
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <Label htmlFor="text">Frågetext</Label>
                          <Textarea
                            id="text"
                            name="text"
                            defaultValue={editingItem?.text || ""}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="type">Typ</Label>
                            <Select name="type" defaultValue={editingItem?.type || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj typ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="checkbox">Kryssruta</SelectItem>
                                <SelectItem value="radio">Alternativ</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="rating">Betyg</SelectItem>
                                <SelectItem value="mood">Humör</SelectItem>
                                <SelectItem value="number">Nummer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="categoryId">Kategori</Label>
                            <Select name="categoryId" defaultValue={editingItem?.categoryId?.toString() || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj kategori" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
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
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isRequired"
                              name="isRequired"
                              defaultChecked={editingItem?.isRequired ?? false}
                            />
                            <Label htmlFor="isRequired">Obligatorisk</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="showInDashboard"
                              name="showInDashboard"
                              defaultChecked={editingItem?.showInDashboard ?? false}
                            />
                            <Label htmlFor="showInDashboard">Visa i dashboard</Label>
                          </div>
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
                  {questions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <QuestionTypeLabel type={question.type} />
                              {question.categoryId && (
                                <Badge variant="outline">
                                  {categories.find(c => c.id === question.categoryId)?.name}
                                </Badge>
                              )}
                              {question.isRequired && (
                                <Badge variant="destructive">Obligatorisk</Badge>
                              )}
                              {question.showInDashboard && (
                                <Badge>Dashboard</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">{question.text}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("questions", question.id)}
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

              {/* Categories Tab */}
              <TabsContent value="categories">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Hantera kategorier</h3>
                  <Dialog open={dialogOpen && activeTab === "categories"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ny kategori
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingItem ? "Redigera kategori" : "Ny kategori"}
                        </DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data: InsertCategory = {
                            name: formData.get("name") as string,
                            key: formData.get("key") as string,
                            description: formData.get("description") as string || undefined,
                            order: parseInt(formData.get("order") as string) || 0,
                            isActive: formData.get("isActive") === "on",
                          };
                          handleSubmit("categories", data);
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
                          <Label htmlFor="key">Nyckel</Label>
                          <Input
                            id="key"
                            name="key"
                            placeholder="t.ex. kvalitet, sakerhet"
                            defaultValue={editingItem?.key || ""}
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
                  {categories.map((category) => (
                    <Card key={category.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                            <p className="text-xs text-gray-500">Nyckel: {category.key}</p>
                            {category.description && (
                              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                            )}
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <Badge variant={category.isActive ? "default" : "secondary"}>
                                {category.isActive ? "Aktiv" : "Inaktiv"}
                              </Badge>
                              <span>Ordning: {category.order}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDialog(category)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("categories", category.id)}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Work Tasks */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Arbetsmoment</CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="mr-1 h-4 w-4" />
                              Lägg till
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Nytt arbetsmoment</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data: InsertWorkTask = {
                                  name: formData.get("name") as string,
                                  hasStations: formData.get("hasStations") === "on",
                                };
                                handleSubmit("work-tasks", data);
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <Label htmlFor="name">Namn</Label>
                                <Input id="name" name="name" required />
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch id="hasStations" name="hasStations" />
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
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {workTasks.map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <span className="text-sm">{task.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("work-tasks", task.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Work Stations */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Arbetsstationer</CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="mr-1 h-4 w-4" />
                              Lägg till
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ny arbetsstation</DialogTitle>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const data: InsertWorkStation = {
                                  name: formData.get("name") as string,
                                  workTaskId: parseInt(formData.get("workTaskId") as string) || null,
                                };
                                handleSubmit("work-stations", data);
                              }}
                              className="space-y-4"
                            >
                              <div>
                                <Label htmlFor="name">Namn</Label>
                                <Input id="name" name="name" required />
                              </div>
                              <div>
                                <Label htmlFor="workTaskId">Arbetsmoment</Label>
                                <Select name="workTaskId">
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
                              <Button type="submit" className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                Spara
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {workStations.map((station) => (
                          <div key={station.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <span className="text-sm">{station.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("work-stations", station.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Save, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type {
  Checklist,
  Category,
  InsertCategory,
  Question,
  InsertQuestion,
} from "@shared/schema";
import Navigation from "@/components/Navigation";

function QuestionTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    checkbox: "Kryssruta",
    radio: "Alternativ",
    text: "Text",
    rating: "Betyg",
    mood: "Humör",
    number: "Nummer",
  };
  return <Badge variant="outline">{labels[type] || type}</Badge>;
}

export default function ChecklistEditor() {
  const params = useParams();
  const checklistId = parseInt(params.id!);
  const [activeTab, setActiveTab] = useState("categories");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  // Queries
  const { data: checklist } = useQuery<Checklist>({
    queryKey: ["/api/checklists", checklistId],
  });

  const categoriesQuery = useQuery<Category[]>({
    queryKey: ["/api/categories", checklistId],
    queryFn: async () => {
      return await apiRequest(`/api/categories?checklistId=${checklistId}`, "GET") as unknown as Category[];
    },
  });

  const questionsQuery = useQuery<Question[]>({
    queryKey: ["/api/questions", "for-checklist", checklistId],
    queryFn: async () => {
      if (!categoriesQuery.data || categoriesQuery.data.length === 0) return [];
      const allQuestions: Question[] = [];
      for (const category of categoriesQuery.data) {
        try {
          const categoryQuestions = await apiRequest(`/api/questions?categoryId=${category.id}`, "GET") as unknown as Question[];
          allQuestions.push(...categoryQuestions);
        } catch (error) {
          console.warn(`Failed to fetch questions for category ${category.id}:`, error);
        }
      }
      return allQuestions;
    },
    enabled: !!categoriesQuery.data && categoriesQuery.data.length > 0,
  });

  const categories = categoriesQuery.data || [];
  const questions = questionsQuery.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest(endpoint, "POST", data);
    },
    onSuccess: (_, { endpoint }) => {
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "all"] });
      }
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
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "all"] });
      }
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
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "all"] });
      }
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

  if (!checklist) {
    return <div>Laddar...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tillbaka till administration
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Redigera checklista: {checklist.name}</CardTitle>
            {checklist.description && (
              <p className="text-sm text-gray-600">{checklist.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">Kategorier</TabsTrigger>
                <TabsTrigger value="questions">Frågor</TabsTrigger>
              </TabsList>

              {/* Categories Tab */}
              <TabsContent value="categories">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Kategorier</h3>
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
                            checklistId: checklistId,
                            key: formData.get("key") as string,
                            description: formData.get("description") as string || undefined,
                            order: parseInt(formData.get("order") as string) || 0,
                            isActive: formData.get("isActive") === "on",
                          };
                          handleSubmit("/api/categories", data);
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
                              onClick={() => handleDelete("/api/categories", category.id)}
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
                  <h3 className="text-lg font-medium">Frågor</h3>
                  <Dialog open={dialogOpen && activeTab === "questions"} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => openDialog()} disabled={categories.length === 0}>
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
                            categoryId: parseInt(formData.get("categoryId") as string),
                            showInDashboard: formData.get("showInDashboard") === "on",
                            dashboardDisplayType: formData.get("dashboardDisplayType") as string || null,
                            order: parseInt(formData.get("order") as string) || 0,
                            isRequired: formData.get("isRequired") === "on",
                            options: formData.get("options") ? JSON.parse(formData.get("options") as string) : null,
                          };
                          handleSubmit("/api/questions", data);
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
                          <Label htmlFor="options">Alternativ (JSON format för radio buttons)</Label>
                          <Textarea
                            id="options"
                            name="options"
                            placeholder='["Alternativ 1", "Alternativ 2", "Alternativ 3"]'
                            defaultValue={editingItem?.options ? JSON.stringify(editingItem.options) : ""}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="order">Ordning</Label>
                            <Input
                              id="order"
                              name="order"
                              type="number"
                              defaultValue={editingItem?.order || 0}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dashboardDisplayType">Dashboard-visning</Label>
                            <Select name="dashboardDisplayType" defaultValue={editingItem?.dashboardDisplayType || ""}>
                              <SelectTrigger>
                                <SelectValue placeholder="Välj visningstyp" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="card">Kort</SelectItem>
                                <SelectItem value="chart">Diagram</SelectItem>
                                <SelectItem value="progress">Progress</SelectItem>
                                <SelectItem value="number">Nummer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showInDashboard"
                            name="showInDashboard"
                            defaultChecked={editingItem?.showInDashboard ?? false}
                          />
                          <Label htmlFor="showInDashboard">Visa i dashboard</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="isRequired"
                            name="isRequired"
                            defaultChecked={editingItem?.isRequired ?? false}
                          />
                          <Label htmlFor="isRequired">Obligatorisk</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          <Save className="mr-2 h-4 w-4" />
                          Spara
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {categories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Du måste skapa kategorier först innan du kan lägga till frågor.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {questions.map((question) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{question.text}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Kategori: {categories.find(c => c.id === question.categoryId)?.name || 'Okänd'}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <QuestionTypeLabel type={question.type} />
                              {question.isRequired && <Badge variant="destructive">Obligatorisk</Badge>}
                              {question.showInDashboard && <Badge variant="outline">Dashboard</Badge>}
                            </div>
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
                              onClick={() => handleDelete("/api/questions", question.id)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
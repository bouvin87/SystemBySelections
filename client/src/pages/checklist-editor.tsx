import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import IconPicker from "@/components/IconPicker";
import { renderIcon } from "@/lib/icon-utils";
import type {
  Category,
  InsertCategory,
  Question,
  InsertQuestion,
  Checklist,
} from "@shared/schema";
import Navigation from "@/components/Navigation";

function QuestionTypeLabel({ type }: { type: string }) {
  const typeLabels: Record<string, string> = {
    text: "Text",
    val: "Val",
    nummer: "Nummer", 
    ja_nej: "Ja/Nej",
    datum: "Datum",
    fil: "Fil",
    stjärnor: "Stjärnor",
    humör: "Humör",
  };
  return <span>{typeLabels[type] || type}</span>;
}

export default function ChecklistEditor() {
  const { id } = useParams<{ id: string }>();
  const checklistId = parseInt(id!);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>("");
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<string>("");
  const { toast } = useToast();

  // Queries
  const { data: checklist } = useQuery<Checklist>({
    queryKey: ["/api/checklists", checklistId],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", checklistId],
    queryFn: async () => {
      const result = await apiRequest("GET", `/api/categories?checklistId=${checklistId}`);
      return await result.json();
    },
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", "for-checklist", checklistId],
    queryFn: async () => {
      if (!categories || categories.length === 0) return [];
      const allQuestions: Question[] = [];
      for (const category of categories) {
        try {
          const result = await apiRequest("GET", `/api/questions?categoryId=${category.id}`);
          const categoryQuestions = await result.json();
          allQuestions.push(...categoryQuestions);
        } catch (error) {
          console.warn(`Failed to fetch questions for category ${category.id}:`, error);
        }
      }
      return allQuestions;
    },
    enabled: categories.length > 0,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async ({ endpoint, data }: { endpoint: string; data: any }) => {
      return apiRequest("POST", endpoint, data);
    },
    onSuccess: (_, { endpoint }) => {
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", checklistId] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "for-checklist", checklistId] });
      }
      setDialogOpen(false);
      setQuestionDialogOpen(false);
      setEditingItem(null);
      setEditingQuestion(null);
      setSelectedCategoryIcon("");
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
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", checklistId] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "for-checklist", checklistId] });
      }
      setDialogOpen(false);
      setQuestionDialogOpen(false);
      setEditingItem(null);
      setEditingQuestion(null);
      setSelectedCategoryIcon("");
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
      if (endpoint.includes("categories")) {
        queryClient.invalidateQueries({ queryKey: ["/api/categories", checklistId] });
      } else if (endpoint.includes("questions")) {
        queryClient.invalidateQueries({ queryKey: ["/api/questions", "for-checklist", checklistId] });
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
    setSelectedCategoryIcon(item?.icon || "");
    setDialogOpen(true);
  };

  const openQuestionDialog = (question?: any, categoryId?: number) => {
    setEditingQuestion(question);
    setSelectedCategory(categoryId || null);
    setSelectedQuestionType(question?.type || "text");
    setQuestionDialogOpen(true);
  };

  const handleSubmit = (endpoint: string, data: any) => {
    if (editingItem) {
      updateMutation.mutate({ endpoint, id: editingItem.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  const handleQuestionSubmit = (endpoint: string, data: any) => {
    if (editingQuestion) {
      updateMutation.mutate({ endpoint, id: editingQuestion.id, data });
    } else {
      createMutation.mutate({ endpoint, data });
    }
  };

  const handleDelete = (endpoint: string, id: number) => {
    if (confirm("Är du säker på att du vill ta bort detta objekt?")) {
      deleteMutation.mutate({ endpoint, id });
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryQuestions = (categoryId: number) => {
    return questions.filter(q => q.categoryId === categoryId);
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium">Kategorier och frågor</h3>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                        icon: selectedCategoryIcon || undefined,
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
                    <IconPicker
                      value={selectedCategoryIcon}
                      onChange={setSelectedCategoryIcon}
                      placeholder="Välj ikon för kategorin"
                    />
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
              {categories.map((category) => {
                const categoryQuestions = getCategoryQuestions(category.id);
                const isExpanded = expandedCategories.has(category.id);

                return (
                  <Card key={category.id}>
                    <CardContent className="p-0">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <div
                            className="p-4 cursor-pointer hover:bg-gray-50"
                            onClick={() => toggleCategory(category.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {renderIcon(category.icon, "h-4 w-4 text-gray-600")}
                                    <h4 className="text-sm font-medium text-gray-900">{category.name}</h4>
                                  </div>
                                  <p className="text-xs text-gray-500">Nyckel: {category.key}</p>
                                  {category.description && (
                                    <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                                  )}
                                  <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                    <Badge variant={category.isActive ? "default" : "secondary"}>
                                      {category.isActive ? "Aktiv" : "Inaktiv"}
                                    </Badge>
                                    <span>Ordning: {category.order}</span>
                                    <span>{categoryQuestions.length} frågor</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDialog(category);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete("/api/categories", category.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        {isExpanded && (
                          <CollapsibleContent>
                            <div className="border-t bg-gray-50 p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h5 className="text-sm font-medium">Frågor för {category.name}</h5>
                                <Button
                                  size="sm"
                                  onClick={() => openQuestionDialog(null, category.id)}
                                >
                                  <Plus className="mr-2 h-3 w-3" />
                                  Ny fråga
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                {categoryQuestions.map((question) => (
                                  <Card key={question.id} className="bg-white">
                                    <CardContent className="p-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="text-sm font-medium">{question.text}</p>
                                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                            <Badge variant="outline">
                                              <QuestionTypeLabel type={question.type} />
                                            </Badge>
                                            {question.isRequired && (
                                              <Badge variant="secondary">Obligatorisk</Badge>
                                            )}
                                            <span>Ordning: {question.order}</span>
                                          </div>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openQuestionDialog(question)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete("/api/questions", question.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                                
                                {categoryQuestions.length === 0 && (
                                  <p className="text-sm text-gray-500 text-center py-4">
                                    Inga frågor ännu. Klicka "Ny fråga" för att lägga till en.
                                  </p>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        )}
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Question Dialog */}
            <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Redigera fråga" : "Ny fråga"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data: InsertQuestion = {
                      text: formData.get("text") as string,
                      type: formData.get("type") as string,
                      categoryId: selectedCategory || editingQuestion?.categoryId,
                      isRequired: formData.get("isRequired") === "on",
                      order: parseInt(formData.get("order") as string) || 0,
                      options: formData.get("options") ? JSON.parse(formData.get("options") as string) : undefined,
                      validation: formData.get("validation") ? JSON.parse(formData.get("validation") as string) : undefined,
                      showInDashboard: formData.get("showInDashboard") === "on",
                      dashboardDisplayType: formData.get("dashboardDisplayType") as string || null,
                      hideInView: formData.get("hideInView") === "on",
                    };
                    handleQuestionSubmit("/api/questions", data);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="text">Frågetext</Label>
                    <Textarea
                      id="text"
                      name="text"
                      defaultValue={editingQuestion?.text || ""}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Typ</Label>
                    <Select 
                      name="type" 
                      defaultValue={editingQuestion?.type || "text"}
                      onValueChange={setSelectedQuestionType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj typ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="val">Val</SelectItem>
                        <SelectItem value="nummer">Nummer</SelectItem>
                        <SelectItem value="ja_nej">Ja/Nej</SelectItem>
                        <SelectItem value="datum">Datum</SelectItem>
                        <SelectItem value="fil">Fil</SelectItem>
                        <SelectItem value="stjärnor">Stjärnor (1-5)</SelectItem>
                        <SelectItem value="humör">Humör (1-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="order">Ordning</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      defaultValue={editingQuestion?.order || 0}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isRequired"
                      name="isRequired"
                      defaultChecked={editingQuestion?.isRequired ?? false}
                    />
                    <Label htmlFor="isRequired">Obligatorisk</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hideInView"
                      name="hideInView"
                      defaultChecked={editingQuestion?.hideInView ?? false}
                    />
                    <Label htmlFor="hideInView">Dölj i visning</Label>
                  </div>
                  <div>
                    <Label htmlFor="options">Alternativ (JSON format för select-typer)</Label>
                    <Textarea
                      id="options"
                      name="options"
                      placeholder='["Alternativ 1", "Alternativ 2"]'
                      defaultValue={editingQuestion?.options ? JSON.stringify(editingQuestion.options) : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validation">Validering (JSON format)</Label>
                    <Textarea
                      id="validation"
                      name="validation"
                      placeholder='{"min": 0, "max": 100}'
                      defaultValue={editingQuestion?.validation ? JSON.stringify(editingQuestion.validation) : ""}
                    />
                  </div>
                  
                  {/* Dashboard Card Configuration - Only for applicable types */}
                  {(selectedQuestionType === "nummer" || selectedQuestionType === "ja_nej" || 
                    selectedQuestionType === "stjärnor" || selectedQuestionType === "humör") && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-3">Dashboard-kort</h4>
                      <div className="flex items-center space-x-2 mb-3">
                        <Switch
                          id="showInDashboard"
                          name="showInDashboard"
                          defaultChecked={editingQuestion?.showInDashboard ?? false}
                        />
                        <Label htmlFor="showInDashboard">Visa som eget kort i dashboard</Label>
                      </div>
                      
                      {(editingQuestion?.showInDashboard) && (
                        <div>
                          <Label htmlFor="dashboardDisplayType">Korttyp</Label>
                          <Select name="dashboardDisplayType" defaultValue={editingQuestion?.dashboardDisplayType || "medelvärde"}>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj korttyp" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medelvärde">Medelvärde</SelectItem>
                              <SelectItem value="graf">Graf (svar över tid)</SelectItem>
                              <SelectItem value="progressbar">Progressbar</SelectItem>
                              <SelectItem value="antal">Antal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    Spara
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
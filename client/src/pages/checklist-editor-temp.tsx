import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { FormModal } from "@/components/FormModal";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Checklist, Category, Question } from "@shared/schema";

export default function ChecklistEditor() {
  const { id: checklistId } = useParams<{ id: string }>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState("text");
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

  // Fetch data
  const { data: checklist } = useQuery<Checklist>({
    queryKey: ["/api/checklists", parseInt(checklistId!)],
    enabled: !!checklistId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", checklistId],
    enabled: !!checklistId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", "for-checklist", checklistId],
    enabled: !!checklistId,
  });

  // Force dashboard cache clear function
  const clearDashboardCache = () => {
    queryClient.removeQueries({
      predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes('/api/dashboard/questions');
      }
    });
  };

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
        clearDashboardCache();
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
        queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
        queryClient.invalidateQueries({ queryKey: ["/api/checklists", parseInt(checklistId!)] });
        clearDashboardCache();
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
        queryClient.invalidateQueries({ queryKey: ["/api/checklists"] });
        queryClient.invalidateQueries({ queryKey: ["/api/checklists", parseInt(checklistId!)] });
        clearDashboardCache();
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

  if (!checklist) {
    return <div>Laddar...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
          <CardContent className="space-y-6">
            
            {/* Categories Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Kategorier</h3>
                <Button onClick={() => openDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Lägg till kategori
                </Button>
              </div>

              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Inga kategorier skapade ännu. Lägg till din första kategori för att komma igång.
                </p>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <Card key={category.id} className="bg-white">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div 
                            className="flex items-center cursor-pointer flex-1"
                            onClick={() => toggleCategory(category.id)}
                          >
                            {expandedCategories.has(category.id) ? (
                              <ChevronDown className="mr-2 h-4 w-4" />
                            ) : (
                              <ChevronRight className="mr-2 h-4 w-4" />
                            )}
                            <div className="flex items-center">
                              {category.icon && (
                                <span className="mr-2 text-lg">{category.icon}</span>
                              )}
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                {category.description && (
                                  <p className="text-sm text-gray-600">{category.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center ml-4">
                              <Badge variant={category.isActive ? "default" : "secondary"}>
                                {category.isActive ? "Aktiv" : "Inaktiv"}
                              </Badge>
                              <span className="ml-2 text-sm text-gray-500">
                                Ordning: {category.order}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDialog(category);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
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
                      </CardHeader>

                      {expandedCategories.has(category.id) && (
                        <CardContent className="pt-0">
                          <Separator className="mb-4" />
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium">Frågor i denna kategori</h5>
                              <Button
                                size="sm"
                                onClick={() => openQuestionDialog(undefined, category.id)}
                              >
                                <Plus className="mr-2 h-3 w-3" />
                                Lägg till fråga
                              </Button>
                            </div>

                            {getCategoryQuestions(category.id).length === 0 ? (
                              <p className="text-gray-500 text-sm py-4">
                                Inga frågor i denna kategori ännu.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {getCategoryQuestions(category.id).map((question) => (
                                  <div
                                    key={question.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center">
                                        <p className="font-medium">{question.text}</p>
                                        <Badge variant="outline" className="ml-2">
                                          {question.type}
                                        </Badge>
                                        {question.isRequired && (
                                          <Badge variant="destructive" className="ml-2">
                                            Obligatorisk
                                          </Badge>
                                        )}
                                        {question.showInDashboard && (
                                          <Badge variant="default" className="ml-2">
                                            Dashboard
                                          </Badge>
                                        )}
                                        {question.hideInView && (
                                          <Badge variant="secondary" className="ml-2">
                                            Dold i vy
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1">
                                        Ordning: {question.order}
                                      </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openQuestionDialog(question)}
                                      >
                                        <Edit2 className="h-4 w-4" />
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
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Modal */}
        <FormModal
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editingItem ? "Redigera kategori" : "Lägg till kategori"}
          fields={[
            {
              name: "name",
              label: "Namn",
              type: "text",
              required: true,
              defaultValue: editingItem?.name || "",
            },
            {
              name: "description",
              label: "Beskrivning",
              type: "textarea",
              defaultValue: editingItem?.description || "",
            },
            {
              name: "order",
              label: "Ordning",
              type: "number",
              required: true,
              defaultValue: editingItem?.order || categories.length + 1,
            },
            {
              name: "isActive",
              label: "Aktiv",
              type: "checkbox",
              defaultValue: editingItem?.isActive ?? true,
            },
            {
              name: "icon",
              label: "Ikon",
              type: "icon-picker",
              defaultValue: editingItem?.icon || "",
            },
          ]}
          onSubmit={(data) => {
            const categoryData = {
              ...data,
              checklistId: parseInt(checklistId!),
              tenantId: 1,
            };
            handleSubmit("/api/categories", categoryData);
          }}
        />

        {/* Question Modal */}
        <FormModal
          isOpen={questionDialogOpen}
          onClose={() => setQuestionDialogOpen(false)}
          title={editingQuestion ? "Redigera fråga" : "Lägg till fråga"}
          fields={[
            {
              name: "categoryId",
              label: "Kategori",
              type: "select",
              required: true,
              options: categories.map(cat => ({ value: cat.id, label: cat.name })),
              defaultValue: editingQuestion?.categoryId || selectedCategory,
            },
            {
              name: "text",
              label: "Frågetext",
              type: "text",
              required: true,
              defaultValue: editingQuestion?.text || "",
            },
            {
              name: "type",
              label: "Frågetyp",
              type: "select",
              required: true,
              options: [
                { value: "text", label: "Text" },
                { value: "textarea", label: "Långtext" },
                { value: "number", label: "Nummer" },
                { value: "checkbox", label: "Kryssruta" },
                { value: "radio", label: "Radioknappar" },
                { value: "select", label: "Dropdown" },
                { value: "date", label: "Datum" },
                { value: "time", label: "Tid" },
                { value: "file", label: "Fil" },
                { value: "rating", label: "Stjärnbetyg" },
                { value: "mood", label: "Humör" },
                { value: "switch", label: "Ja/Nej växel" },
              ],
              defaultValue: editingQuestion?.type || selectedQuestionType,
            },
            {
              name: "isRequired",
              label: "Obligatorisk",
              type: "checkbox",
              defaultValue: editingQuestion?.isRequired ?? false,
            },
            {
              name: "order",
              label: "Ordning",
              type: "number",
              required: true,
              defaultValue: editingQuestion?.order || questions.length + 1,
            },
            {
              name: "showInDashboard",
              label: "Visa i dashboard",
              type: "checkbox",
              defaultValue: editingQuestion?.showInDashboard ?? false,
            },
            {
              name: "dashboardDisplayType",
              label: "Dashboard-visningstyp",
              type: "select",
              options: [
                { value: "chart", label: "Diagram" },
                { value: "list", label: "Lista" },
                { value: "count", label: "Antal" },
                { value: "average", label: "Medelvärde" },
              ],
              defaultValue: editingQuestion?.dashboardDisplayType || "chart",
            },
            {
              name: "hideInView",
              label: "Dölj i svarvy",
              type: "checkbox",
              defaultValue: editingQuestion?.hideInView ?? false,
            },
            {
              name: "options",
              label: "Alternativ (JSON för select/radio/checkbox)",
              type: "textarea",
              defaultValue: editingQuestion?.options ? JSON.stringify(editingQuestion.options, null, 2) : "",
            },
            {
              name: "validation",
              label: "Validering (JSON)",
              type: "textarea",
              defaultValue: editingQuestion?.validation ? JSON.stringify(editingQuestion.validation, null, 2) : "",
            },
          ]}
          onSubmit={(data) => {
            let processedData = { ...data };
            
            // Parse JSON fields
            if (processedData.options) {
              try {
                processedData.options = JSON.parse(processedData.options);
              } catch {
                processedData.options = null;
              }
            }
            
            if (processedData.validation) {
              try {
                processedData.validation = JSON.parse(processedData.validation);
              } catch {
                processedData.validation = null;
              }
            }
            
            processedData.tenantId = 1;
            handleQuestionSubmit("/api/questions", processedData);
          }}
        />
      </div>
    </div>
  );
}
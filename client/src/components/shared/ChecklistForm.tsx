import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ChecklistFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  showProgress?: boolean;
}

export function ChecklistForm({ onSuccess, onCancel, showProgress = true }: ChecklistFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    checklistId: 0,
    shiftId: 0,
    workStationId: 0,
    responses: {} as Record<number, any>,
  });

  // Data queries
  const { data: checklists = [] } = useQuery({
    queryKey: ["/api/checklists"],
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ["/api/shifts"],
  });

  const { data: workStations = [] } = useQuery({
    queryKey: ["/api/work-stations"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    enabled: !!formData.checklistId,
  });

  const { data: workTasks = [] } = useQuery({
    queryKey: ["/api/checklists", formData.checklistId, "work-tasks"],
    enabled: !!formData.checklistId,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["/api/questions"],
    enabled: !!formData.checklistId,
  });

  // Filter questions based on selected checklist
  const filteredQuestions = questions.filter((q: any) => 
    categories.some((c: any) => c.checklistId === formData.checklistId && c.id === q.categoryId)
  );

  // Filtered work stations based on selected work tasks
  const filteredWorkStations = workStations.filter((station: any) => {
    if (workTasks.length === 0) return true;
    return workTasks.some((task: any) => task.workStationId === station.id);
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit form");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/responses"] });
      toast({ title: "Kontroll sparad", description: "Kontrollen har sparats framgångsrikt" });
      onSuccess();
    },
  });

  const validateCurrentStep = (): boolean => {
    const errors: string[] = [];

    if (currentStep === 1) {
      // Identification step
      if (!formData.checklistId) errors.push("Checklista");
      if (!formData.shiftId) errors.push("Skift");
      if (!formData.workStationId) errors.push("Arbetsstation");
    } else if (currentStep > 1) {
      // Question steps
      const category = categories[currentStep - 2];
      if (category) {
        const categoryQuestions = filteredQuestions.filter((q: any) => q.categoryId === category.id);
        categoryQuestions.forEach((question: any) => {
          if (question.isRequired && !formData.responses[question.id]) {
            errors.push(question.text.substring(0, 30) + "...");
          }
        });
      }
    }

    if (errors.length > 0) {
      toast({
        title: "Obligatoriska fält saknas",
        description: `Följande fält måste fyllas i: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    if (validateCurrentStep()) {
      submitMutation.mutate({
        checklistId: formData.checklistId,
        shiftId: formData.shiftId,
        workStationId: formData.workStationId,
        responses: Object.entries(formData.responses).map(([questionId, value]) => ({
          questionId: parseInt(questionId),
          value: value?.toString() || "",
        })),
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateResponse = (questionId: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      responses: { ...prev.responses, [questionId]: value }
    }));
  };

  const totalSteps = categories.length + 1;
  const progress = ((currentStep - 1) / totalSteps) * 100;

  const selectedChecklist = checklists.find((c: any) => c.id === formData.checklistId);
  const title = selectedChecklist?.name || t('form.newControl');

  const renderIdentificationStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Identifiering</h2>
      
      <div className="space-y-2">
        <Label htmlFor="checklist">Checklista *</Label>
        <Select
          value={formData.checklistId?.toString() || ""}
          onValueChange={(value: string) => updateFormData("checklistId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj checklista" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Välj checklista</SelectItem>
            {(checklists as any[]).map((checklist: any) => (
              <SelectItem key={checklist.id} value={checklist.id.toString()}>
                {checklist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shift">Skift *</Label>
        <Select
          value={formData.shiftId?.toString() || ""}
          onValueChange={(value: string) => updateFormData("shiftId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj skift" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Välj skift</SelectItem>
            {(shifts as any[]).map((shift: any) => (
              <SelectItem key={shift.id} value={shift.id.toString()}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workStation">Arbetsstation *</Label>
        <Select
          value={formData.workStationId?.toString() || ""}
          onValueChange={(value: string) => updateFormData("workStationId", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Välj arbetsstation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Välj arbetsstation</SelectItem>
            {filteredWorkStations.map((station: any) => (
              <SelectItem key={station.id} value={station.id.toString()}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderQuestionStep = () => {
    const category = (categories as any[])[currentStep - 2];
    if (!category) return null;

    const categoryQuestions = filteredQuestions.filter((q: any) => q.categoryId === category.id);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">{category.name}</h2>
        
        {categoryQuestions.map((question: any) => (
          <div key={question.id} className="space-y-2">
            {question.type === "text" && (
              <div className="space-y-2">
                <Label>{question.text}{question.isRequired ? " *" : ""}</Label>
                <Input
                  value={formData.responses[question.id] || ""}
                  onChange={(e: any) => updateResponse(question.id, e.target.value)}
                  placeholder="Skriv ditt svar"
                />
              </div>
            )}

            {question.type === "textarea" && (
              <div className="space-y-2">
                <Label>{question.text}{question.isRequired ? " *" : ""}</Label>
                <Textarea
                  value={formData.responses[question.id] || ""}
                  onChange={(e: any) => updateResponse(question.id, e.target.value)}
                  placeholder="Skriv ditt svar"
                  rows={3}
                />
              </div>
            )}

            {question.type === "number" && (
              <div className="space-y-2">
                <Label>{question.text}{question.isRequired ? " *" : ""}</Label>
                <Input
                  type="number"
                  value={formData.responses[question.id] || ""}
                  onChange={(e: any) => updateResponse(question.id, parseFloat(e.target.value))}
                  placeholder="Ange nummer"
                />
              </div>
            )}

            {question.type === "select" && question.options && (
              <div className="space-y-2">
                <Label>{question.text}{question.isRequired ? " *" : ""}</Label>
                <Select
                  value={formData.responses[question.id]?.toString() || ""}
                  onValueChange={(value: string) => updateResponse(question.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Välj alternativ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Välj alternativ</SelectItem>
                    {question.options.map((option: string, index: number) => (
                      <SelectItem key={index} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {question.type === "switch" && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.responses[question.id] || false}
                  onChange={(e: any) => updateResponse(question.id, e.target.checked)}
                  className="h-4 w-4"
                />
                <Label className="text-sm font-medium">
                  {question.text}{question.isRequired && " *"}
                </Label>
              </div>
            )}

            {question.type === "stars" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {question.text}{question.isRequired && " *"}
                </Label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateResponse(question.id, star)}
                      className={`text-2xl ${
                        (formData.responses[question.id] || 0) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const isLastStep = currentStep > categories.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Steg {currentStep} av {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </div>

      {/* Form content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderIdentificationStep()}
        {currentStep > 1 && renderQuestionStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handlePrevious}
          disabled={submitMutation.isPending}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Avbryt" : "Föregående"}
        </Button>

        <Button
          type="button"
          onClick={isLastStep ? handleSubmit : handleNext}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? "Sparar..." : isLastStep ? "Slutför" : "Nästa"}
          {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
}
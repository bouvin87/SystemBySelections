import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Star, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { type Checklist, type WorkTask, type WorkStation, type Shift, type Question, type Category } from "@shared/schema";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedChecklistId?: number;
}

interface FormData {
  checklistId: number | null;
  operatorName: string;
  workTaskId: number | null;
  workStationId: number | null;
  shiftId: number | null;
  responses: Record<string, any>;
}

const MOOD_EMOJIS = ["😞", "😐", "🙂", "😊", "😄"];

export default function FormModal({ isOpen, onClose, preselectedChecklistId }: FormModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(2); // Start directly at identification step
  const [formData, setFormData] = useState<FormData>({
    checklistId: preselectedChecklistId || null,
    operatorName: "",
    workTaskId: null,
    workStationId: null,
    shiftId: null,
    responses: {},
  });

  // Update form data when preselected checklist changes
  useEffect(() => {
    if (preselectedChecklistId) {
      setFormData(prev => ({
        ...prev,
        checklistId: preselectedChecklistId
      }));
    }
  }, [preselectedChecklistId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(2); // Always reset to identification step
      setFormData({
        checklistId: preselectedChecklistId || null,
        operatorName: "",
        workTaskId: null,
        workStationId: null,
        shiftId: null,
        responses: {},
      });
    }
  }, [isOpen, preselectedChecklistId]);

  const { data: checklists = [] } = useQuery<Checklist[]>({
    queryKey: ["/api/checklists"],
    enabled: isOpen,
  });

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen,
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: isOpen && formData.workTaskId !== null,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: isOpen,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", "checklist", formData.checklistId],
    queryFn: async () => {
      if (!formData.checklistId) return [];
      const response = await fetch(`/api/questions?checklistId=${formData.checklistId}`);
      if (!response.ok) throw new Error('Failed to fetch questions');
      return response.json();
    },
    enabled: isOpen && formData.checklistId !== null,
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
      toast({
        title: "Kontroll sparad!",
        description: "Ditt formulär har sparats framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      resetForm();
      onClose();
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte spara formuläret. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCurrentStep(2);
    setFormData({
      checklistId: preselectedChecklistId || null,
      operatorName: "",
      workTaskId: null,
      workStationId: null,
      shiftId: null,
      responses: {},
    });
  };

  const totalSteps = 1 + categories.length; // Only identification step + category steps
  const progress = ((currentStep - 1) / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps + 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 2) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const submitData = {
      checklistId: formData.checklistId!,
      operatorName: formData.operatorName,
      workTaskId: formData.workTaskId!,
      workStationId: formData.workStationId,
      shiftId: formData.shiftId!,
      responses: formData.responses,
      isCompleted: true,
    };
    submitMutation.mutate(submitData);
  };

  const renderStarRating = (questionId: number, currentRating: number = 0) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            className={`text-2xl transition-colors ${
              rating <= currentRating ? "text-accent" : "text-gray-300 hover:text-accent"
            }`}
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                responses: { ...prev.responses, [questionId]: rating }
              }));
            }}
          >
            <Star fill={rating <= currentRating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    );
  };

  const renderMoodRating = (questionId: number, currentMood: number = 0) => {
    return (
      <div className="flex space-x-2">
        {MOOD_EMOJIS.map((emoji, index) => {
          const moodValue = index + 1;
          return (
            <button
              key={index}
              type="button"
              className={`text-3xl transition-all hover:scale-110 ${
                moodValue === currentMood ? "scale-110 opacity-100" : "opacity-50"
              }`}
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  responses: { ...prev.responses, [questionId]: moodValue }
                }));
              }}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-medium mb-4">Identifiering</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operator">Operatör</Label>
              <Input
                id="operator"
                placeholder="Ditt namn"
                value={formData.operatorName}
                onChange={(e) => setFormData(prev => ({ ...prev, operatorName: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label>Arbetsmoment</Label>
              <Select
                value={formData.workTaskId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workTaskId: parseInt(value) }))}
              >
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
            
            <div>
              <Label>Station</Label>
              <Select
                value={formData.workStationId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workStationId: parseInt(value) }))}
                disabled={!formData.workTaskId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj station" />
                </SelectTrigger>
                <SelectContent>
                  {workStations
                    .filter(station => station.workTaskId === formData.workTaskId)
                    .map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Skift</Label>
              <Select
                value={formData.shiftId?.toString() || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, shiftId: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj skift" />
                </SelectTrigger>
                <SelectContent>
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.name} ({shift.startTime}-{shift.endTime})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    }

    // Question steps
    const categoryIndex = currentStep - 3;
    const category = categories[categoryIndex];
    const categoryQuestions = questions.filter(q => q.categoryId === category?.id);

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium mb-4">{category?.name}</h3>
        {categoryQuestions.map((question) => (
          <Card key={question.id} className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                {question.text}
                {question.isRequired && <span className="text-destructive ml-1">*</span>}
              </Label>
              
              {question.type === "checkbox" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`question-${question.id}`}
                    checked={formData.responses[question.id] || false}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        responses: { ...prev.responses, [question.id]: checked }
                      }));
                    }}
                  />
                  <Label htmlFor={`question-${question.id}`} className="text-sm text-gray-700">
                    Ja
                  </Label>
                </div>
              )}
              
              {question.type === "radio" && question.options && (
                <RadioGroup
                  value={formData.responses[question.id]?.toString() || ""}
                  onValueChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      responses: { ...prev.responses, [question.id]: value }
                    }));
                  }}
                >
                  {(question.options as string[]).map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                      <Label htmlFor={`${question.id}-${index}`} className="text-sm text-gray-700">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {question.type === "text" && (
                <Textarea
                  placeholder="Skriv dina kommentarer här..."
                  value={formData.responses[question.id] || ""}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      responses: { ...prev.responses, [question.id]: e.target.value }
                    }));
                  }}
                  rows={3}
                />
              )}
              
              {question.type === "number" && (
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={formData.responses[question.id] || ""}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      responses: { ...prev.responses, [question.id]: parseInt(e.target.value) || 0 }
                    }));
                  }}
                />
              )}
              
              {question.type === "rating" && renderStarRating(question.id, formData.responses[question.id])}
              
              {question.type === "mood" && renderMoodRating(question.id, formData.responses[question.id])}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const canProceed = () => {
    if (currentStep === 2) return formData.operatorName && formData.workTaskId && formData.shiftId;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-screen overflow-hidden">
        <DialogHeader>
          <DialogTitle>Ny kontroll</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 -mx-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Steg {currentStep - 1} av {totalSteps}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% klart</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Modal Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-96 -mx-6">
          {renderStep()}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handlePrevious}
            disabled={currentStep === 2}
            className={currentStep === 2 ? "invisible" : ""}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Föregående
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={!canProceed() || submitMutation.isPending}
            >
              {currentStep === totalSteps + 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Slutför
                </>
              ) : (
                <>
                  Nästa
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

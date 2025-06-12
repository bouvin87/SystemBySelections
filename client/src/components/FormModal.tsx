import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";

import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import { Star, ChevronLeft, ChevronRight, Check, X, Frown, Meh, Smile } from "lucide-react";
import {
  type Checklist,
  type WorkTask,
  type WorkStation,
  type Shift,
  type Question,
  type Category,
} from "@shared/schema";

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

export default function FormModal({
  isOpen,
  onClose,
  preselectedChecklistId,
}: FormModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
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
      setFormData((prev) => ({
        ...prev,
        checklistId: preselectedChecklistId,
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

  // Get the current checklist configuration
  const currentChecklist = checklists.find(c => c.id === formData.checklistId);

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen && currentChecklist?.includeWorkTasks,
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: isOpen && currentChecklist?.includeWorkStations && formData.workTaskId !== null,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: isOpen && currentChecklist?.includeShifts,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", formData.checklistId],
    queryFn: async () => {
      if (!formData.checklistId) return [];
      const response = await fetch(
        `/api/categories?checklistId=${formData.checklistId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
    enabled: isOpen && formData.checklistId !== null,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/questions", "for-checklist", formData.checklistId],
    queryFn: async () => {
      if (!categories || categories.length === 0) return [];
      const allQuestions: Question[] = [];
      for (const category of categories) {
        try {
          const response = await fetch(
            `/api/questions?categoryId=${category.id}`,
          );
          if (response.ok) {
            const categoryQuestions = await response.json();
            allQuestions.push(...categoryQuestions);
          }
        } catch (error) {
          console.warn(
            `Failed to fetch questions for category ${category.id}:`,
            error,
          );
        }
      }
      return allQuestions;
    },
    enabled: isOpen && formData.checklistId !== null && categories.length > 0,
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

  // Filter categories to only include those with questions
  const categoriesWithQuestions = categories.filter((category) =>
    questions.some((question) => question.categoryId === category.id),
  );

  const totalSteps = 1 + categoriesWithQuestions.length; // Only identification step + category steps with questions
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
    const submitData: any = {
      checklistId: formData.checklistId!,
      operatorName: formData.operatorName,
      responses: formData.responses,
      isCompleted: true,
    };

    // Only include work task, station, and shift if the checklist requires them
    if (currentChecklist?.includeWorkTasks) {
      submitData.workTaskId = formData.workTaskId;
    }
    if (currentChecklist?.includeWorkStations) {
      submitData.workStationId = formData.workStationId;
    }
    if (currentChecklist?.includeShifts) {
      submitData.shiftId = formData.shiftId;
    }

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
              rating <= currentRating
                ? "text-accent"
                : "text-gray-300 hover:text-accent"
            }`}
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                responses: { ...prev.responses, [questionId]: rating },
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
                moodValue === currentMood
                  ? "scale-110 opacity-100"
                  : "opacity-50"
              }`}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  responses: { ...prev.responses, [questionId]: moodValue },
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
              <Label htmlFor="operator">
                {t('form.operatorName')} <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="operator"
                placeholder={t('form.operatorName')}
                value={formData.operatorName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    operatorName: e.target.value,
                  }))
                }
                required
              />
            </div>

            {currentChecklist?.includeWorkTasks && (
              <div>
                <Label>
                  {t('admin.workTasks')} <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.workTaskId?.toString() || ""}
                  onValueChange={(value) => {
                    const taskId = parseInt(value);
                    const selectedTask = workTasks.find(task => task.id === taskId);
                    setFormData((prev) => ({
                      ...prev,
                      workTaskId: taskId,
                      // Clear station selection if the new task doesn't have stations
                      workStationId: selectedTask?.hasStations ? prev.workStationId : null,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectWorkTask')} />
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
            )}

            {currentChecklist?.includeWorkStations && (
              <div>
                <Label>
                  {t('admin.workStations')}
                  {formData.workTaskId && workTasks.find(task => task.id === formData.workTaskId)?.hasStations && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Select
                  value={formData.workStationId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      workStationId: parseInt(value),
                    }))
                  }
                  disabled={
                    !formData.workTaskId || 
                    !workTasks.find(task => task.id === formData.workTaskId)?.hasStations
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectWorkStation')} />
                  </SelectTrigger>
                  <SelectContent>
                    {workStations
                      .filter(
                        (station) => station.workTaskId === formData.workTaskId,
                      )
                      .map((station) => (
                        <SelectItem
                          key={station.id}
                          value={station.id.toString()}
                        >
                          {station.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentChecklist?.includeShifts && (
              <div>
                <Label>
                  {t('admin.shifts')} <span className="text-destructive ml-1">*</span>
                </Label>
                <Select
                  value={formData.shiftId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, shiftId: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('form.selectShift')} />
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
            )}
          </div>
        </div>
      );
    }

    // Question steps
    const categoryIndex = currentStep - 3;
    const category = categoriesWithQuestions[categoryIndex];
    const categoryQuestions = questions.filter(
      (q) => q.categoryId === category?.id,
    );

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium mb-4">{category?.name}</h3>
        {categoryQuestions.map((question) => (
          <div key={question.id} className="space-y-3">
            {question.type !== "check" && question.type !== "ja_nej" && (
              <Label className="text-sm font-medium text-gray-900">
                {question.text}
                {question.isRequired && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
            )}

            {question.type === "text" && (
              <Textarea
                placeholder={t('form.writeComments')}
                value={formData.responses[question.id] || ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    responses: {
                      ...prev.responses,
                      [question.id]: e.target.value,
                    },
                  }));
                }}
                rows={3}
              />
            )}

            {question.type === "val" &&
              question.options &&
              Array.isArray(question.options) && (
                <RadioGroup
                  value={formData.responses[question.id]?.toString() || ""}
                  onValueChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      responses: { ...prev.responses, [question.id]: value },
                    }));
                  }}
                >
                  {question.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`${question.id}-${index}`}
                      />
                      <Label
                        htmlFor={`${question.id}-${index}`}
                        className="text-sm text-gray-700"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

            {question.type === "nummer" && (
              <Input
                type="number"
                placeholder="Ange nummer..."
                value={formData.responses[question.id] || ""}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    responses: {
                        ...prev.responses,
                        [question.id]: e.target.value,
                      },
                    }));
                  }}
                />
              )}

              {(question.type === "ja_nej" || question.type === "boolean") && (
                <div className="flex items-center space-x-3">
                  <Switch
                    id={`question-${question.id}`}
                    checked={formData.responses[question.id] || false}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        responses: {
                          ...prev.responses,
                          [question.id]: checked,
                        },
                      }));
                    }}
                  />
                  <Label
                    htmlFor={`question-${question.id}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {question.text}
                    {question.isRequired && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                </div>
              )}

              {(question.type === "datum" || question.type === "date") && (
                <Input
                  type="date"
                  value={formData.responses[question.id] || ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      responses: {
                        ...prev.responses,
                        [question.id]: e.target.value,
                      },
                    }));
                  }}
                />
              )}

              {question.type === "fil" && (
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData((prev) => ({
                        ...prev,
                        responses: {
                          ...prev.responses,
                          [question.id]: file.name,
                        },
                      }));
                    }
                  }}
                />
              )}

              {question.type === "stjärnor" && (
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const responseValue = formData.responses[question.id];
                    const currentRating = responseValue ? Number(responseValue) : 0;
                    const isActive = currentRating > 0 && star <= currentRating;
                    

                    
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            responses: { ...prev.responses, [question.id]: star },
                          }));
                        }}
                        className={`transition-colors hover:text-yellow-400 focus:outline-none ${
                          isActive ? "text-yellow-500" : "text-gray-400"
                        }`}
                      >
                        <Star 
                          className="h-8 w-8" 
                          fill={isActive ? "currentColor" : "none"}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {question.type === "humör" && (
                <div className="flex space-x-2">
                  {[
                    { value: 1, emoji: "😢", label: "Mycket dåligt" },
                    { value: 2, emoji: "😞", label: "Dåligt" },
                    { value: 3, emoji: "😐", label: "Okej" },
                    { value: 4, emoji: "😊", label: "Bra" },
                    { value: 5, emoji: "😄", label: "Mycket bra" },
                  ].map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          responses: {
                            ...prev.responses,
                            [question.id]: mood.value,
                          },
                        }));
                      }}
                      className={`text-3xl p-2 rounded-lg border-2 transition-all ${
                        formData.responses[question.id] === mood.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      title={mood.label}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "check" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`check-${question.id}`}
                    checked={formData.responses[question.id] === true}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        responses: {
                          ...prev.responses,
                          [question.id]: checked === true,
                        },
                      }));
                    }}
                  />
                  <Label 
                    htmlFor={`check-${question.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {question.text}
                    {question.isRequired && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                </div>
              )}
          </div>
        ))}
      </div>
    );
  };

  const canProceed = () => {
    if (currentStep === 2) {
      // Always require operator name
      if (!formData.operatorName) return false;
      
      // Only require work task if the checklist includes it
      if (currentChecklist?.includeWorkTasks && !formData.workTaskId) return false;
      
      // If work task has stations and checklist includes work stations, require station selection
      if (currentChecklist?.includeWorkStations && formData.workTaskId) {
        const selectedWorkTask = workTasks.find(task => task.id === formData.workTaskId);
        if (selectedWorkTask?.hasStations && !formData.workStationId) return false;
      }
      
      // Only require shift if the checklist includes it
      if (currentChecklist?.includeShifts && !formData.shiftId) return false;
      
      return true;
    }
    
    if (currentStep === 3) {
      // Check that all required questions are answered
      for (const question of questions) {
        if (question.isRequired) {
          const response = formData.responses[question.id];
          if (!response || response === "" || response === null || response === undefined) {
            return false;
          }
        }
      }
      return true;
    }
    
    return true;
  };

  // Get the selected checklist name for the title
  const selectedChecklist = checklists.find(
    (c) => c.id === formData.checklistId,
  );
  const modalTitle = selectedChecklist
    ? `Ny ${selectedChecklist.name}`
    : "Ny kontroll";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl max-h-screen overflow-hidden">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 -mx-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Steg {currentStep - 1} av {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% klart
            </span>
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
            {t('form.previous')}
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose}>
              {t('admin.cancel')}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitMutation.isPending}
            >
              {currentStep === totalSteps + 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('form.submit')}
                </>
              ) : (
                <>
                  {t('form.next')}
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

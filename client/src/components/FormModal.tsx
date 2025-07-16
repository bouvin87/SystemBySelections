import { useState, useEffect, useMemo } from "react";
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
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Frown,
  Meh,
  Smile,
} from "lucide-react";
import {
  type Checklist,
  type WorkTask,
  type WorkStation,
  type Shift,
  type Question,
  type Category,
  type QuestionWorkTask,
} from "@shared/schema";
import { FloatingInput } from "./ui/floatingInput";
import { FloatingSelect } from "./ui/floatingSelect";
import { FloatingDatePicker } from "./ui/floatingDatePicker";
import { FloatingTextarea } from "./ui/floatingTextarea";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedChecklistId?: string;
}

interface FormData {
  checklistId: string;
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
    checklistId: preselectedChecklistId || "",
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
        workTaskId: null, // Reset work task when checklist changes
        workStationId: null, // Reset work station when checklist changes
      }));
    }
  }, [preselectedChecklistId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(2); // Always reset to identification step
      setFormData({
        checklistId: preselectedChecklistId || "",
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
  const currentChecklist = checklists.find(
    (c) => c.id === formData.checklistId,
  );



  // Hämta arbetsmoment kopplade till den valda checklistan
  const { data: checklistWorkTasks = [] } = useQuery({
    queryKey: [`/api/checklists/${formData.checklistId}/work-tasks`],
    enabled: Boolean(isOpen && formData.checklistId),
  });

  // Hämta alla arbetsmoment för att kunna visa namn
  const { data: allWorkTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen && Array.isArray(checklistWorkTasks) && checklistWorkTasks.length > 0,
  });

  // Filtrera arbetsmoment baserat på vad som är kopplat till checklistan
  const workTasks = useMemo(() => {
    if (!Array.isArray(checklistWorkTasks) || !Array.isArray(allWorkTasks)) {
      return [];
    }
    return allWorkTasks.filter((wt) =>
      checklistWorkTasks.some((cwt: any) => cwt.workTaskId === wt.id),
    );
  }, [checklistWorkTasks, allWorkTasks]);

  // Auto-select work task if only one is available
  useEffect(() => {
    if (workTasks.length === 1 && formData.workTaskId === null) {
      setFormData((prev) => ({
        ...prev,
        workTaskId: workTasks[0].id,
      }));
    } else if (workTasks.length === 0 && formData.workTaskId !== null) {
      setFormData((prev) => ({
        ...prev,
        workTaskId: null,
        workStationId: null,
      }));
    }
  }, [workTasks.length, formData.workTaskId]);

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: isOpen,
  });

  const { data: shifts = [] } = useQuery<Shift[]>({
    queryKey: ["/api/shifts"],
    enabled: isOpen,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories", formData.checklistId],
    queryFn: async () => {
      if (!formData.checklistId) return [];
      const response = await apiRequest(
        "GET",
        `/api/categories?checklistId=${formData.checklistId}`,
      );
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
          const response = await apiRequest(
            "GET",
            `/api/questions?categoryId=${category.id}`,
          );
          const categoryQuestions = await response.json();
          allQuestions.push(...categoryQuestions);
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

  // Hämta alla frågornas arbetsmoment-kopplingar
  const { data: allQuestionWorkTasks = [] } = useQuery<QuestionWorkTask[]>({
    queryKey: [
      "/api/question-work-tasks",
      "for-checklist",
      formData.checklistId,
    ],
    queryFn: async () => {
      if (!questions || questions.length === 0) return [];
      const allQuestionWorkTasks: QuestionWorkTask[] = [];

      // Hämta arbetsmoment-kopplingar för alla frågor
      for (const question of questions) {
        try {
          const response = await apiRequest(
            "GET",
            `/api/questions/${question.id}/work-tasks`,
          );
          const questionWorkTasks = await response.json();
          allQuestionWorkTasks.push(...questionWorkTasks);
        } catch (error) {
          console.warn(
            `Failed to fetch work tasks for question ${question.id}:`,
            error,
          );
        }
      }
      return allQuestionWorkTasks;
    },
    enabled: isOpen && questions.length > 0,
  });

  // Filtrera frågor baserat på valt arbetsmoment
  const filteredQuestions = useMemo(() => {
    if (!formData.workTaskId || workTasks.length === 0) {
      // Om inget arbetsmoment är valt eller inga arbetsmoment är tillgängliga, visa alla frågor
      return questions;
    }

    return questions.filter((question) => {
      // Kolla om frågan har några arbetsmoment-kopplingar
      const questionWorkTasks = allQuestionWorkTasks.filter(
        (qwt) => qwt.questionId === question.id,
      );

      // Om frågan inte har några kopplingar, visa den för alla arbetsmoment
      if (questionWorkTasks.length === 0) {
        return true;
      }

      // Om frågan har kopplingar, visa bara om det valda arbetsmoment är inkluderat
      return questionWorkTasks.some(
        (qwt) => qwt.workTaskId === formData.workTaskId,
      );
    });
  }, [
    questions,
    allQuestionWorkTasks,
    formData.workTaskId,
    workTasks.length,
  ]);

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/responses", data);
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
      checklistId: preselectedChecklistId || "",
      operatorName: "",
      workTaskId: null,
      workStationId: null,
      shiftId: null,
      responses: {},
    });
  };

  // Filter categories to only include those with questions (efter filtrering för arbetsmoment)
  const categoriesWithQuestions = categories.filter((category) =>
    filteredQuestions.some((question) => question.categoryId === category.id),
  );

  const totalSteps = 1 + categoriesWithQuestions.length; // Identification step + category steps with questions
  const progress =
    totalSteps > 1 ? ((currentStep - 2) / (totalSteps - 1)) * 100 : 0;

  const handleNext = () => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      return; // Stop if validation fails
    }

    if (currentStep < totalSteps + 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const validateCurrentStep = () => {
    const missingFields: string[] = [];

    if (currentStep === 2) {
      // Identification step validation
      if (!formData.operatorName.trim()) {
        missingFields.push("Operatörsnamn");
      }

      if (workTasks.length > 0 && !formData.workTaskId) {
        missingFields.push("Arbetsuppgift");
      }

      if (workTasks.length > 0 && formData.workTaskId) {
        const selectedWorkTask = workTasks.find(
          (task) => task.id === formData.workTaskId,
        );
        if (selectedWorkTask?.hasStations && !formData.workStationId) {
          missingFields.push("Arbetsstation");
        }
      }

      if (shifts.length > 0 && !formData.shiftId) {
        missingFields.push("Skift");
      }
    } else if (currentStep >= 3) {
      // Question step validation
      const categoryIndex = currentStep - 3;
      const category = categoriesWithQuestions[categoryIndex];

      if (category) {
        const categoryQuestions = filteredQuestions.filter(
          (q) => q.categoryId === category.id,
        );

        for (const question of categoryQuestions) {
          if (question.isRequired) {
            const response = formData.responses[question.id];

            if (question.type === "check") {
              if (response !== true) {
                missingFields.push(`Fråga: "${question.text}"`);
              }
            } else {
              if (
                response === undefined ||
                response === null ||
                response === ""
              ) {
                missingFields.push(`Fråga: "${question.text}"`);
              }
            }
          }
        }
      }
    }

    if (missingFields.length > 0) {
      toast({
        title: "Obligatoriska fält saknas",
        description: `Följande fält måste fyllas i: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
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

    // Only include work task, station, and shift if they are available
    if (workTasks.length > 0) {
      submitData.workTaskId = formData.workTaskId;
    }
    if (workTasks.length > 0) {
      submitData.workStationId = formData.workStationId;
    }
    if (shifts.length > 0) {
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
              <FloatingInput
                label={t("form.operatorName")}
                id="operator"
                name="operator"
                required
                value={formData.operatorName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    operatorName: e.target.value,
                  }))
                }
              />
            </div>

            {workTasks.length > 0 && (
              <div>
                <FloatingSelect
                  label={t("admin.workTasks")}
                  name="workTaskId"
                  required
                  value={formData.workTaskId?.toString() || ""}
                  onChange={(value) => {
                    const taskId = parseInt(value);
                    const selectedTask = workTasks.find(
                      (task) => task.id === taskId,
                    );
                    setFormData((prev) => ({
                      ...prev,
                      workTaskId: taskId,
                      // Reset workStationId when changing workTask
                      workStationId: null,
                    }));
                  }}
                  placeholder={t("form.selectWorkTask")}
                >
                  {workTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            )}

            {workTasks.length > 0 && (
              <div>
                <FloatingSelect
                  label={t("admin.workStations")}
                  name="workStationId"
                  value={formData.workStationId?.toString() || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      workStationId: parseInt(value),
                    }))
                  }
                  placeholder={t("form.selectWorkStation")}
                  required={
                    !!formData.workTaskId &&
                    !!workTasks.find((task) => task.id === formData.workTaskId)
                      ?.hasStations
                  }
                  disabled={
                    !formData.workTaskId ||
                    !workTasks.find((task) => task.id === formData.workTaskId)
                      ?.hasStations
                  }
                >
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
                </FloatingSelect>
              </div>
            )}

            {shifts.length > 0 && (
              <div>
                <FloatingSelect
                  label={t("admin.shifts")}
                  name="shiftId"
                  value={formData.shiftId?.toString() || ""}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      shiftId: parseInt(value),
                    }))
                  }
                  placeholder={t("form.selectShift")}
                  required
                >
                  {shifts.map((shift) => (
                    <SelectItem key={shift.id} value={shift.id.toString()}>
                      {shift.name} ({shift.startTime}-{shift.endTime})
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Question steps
    const categoryIndex = currentStep - 3;
    const category = categoriesWithQuestions[categoryIndex];
    const categoryQuestions = filteredQuestions.filter(
      (q) => q.categoryId === category?.id,
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-4">{category?.name}</h3>
        {categoryQuestions.map((question) => (
          <div key={question.id} className="space-y-3">
            {question.type === "text" && (
              <FloatingTextarea
                label={question.text}
                id={`question_${question.id}`}
                name={`question_${question.id}`}
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
                <>
                  <Label className="text-sm font-medium text-gray-900">
                    {question.text}
                    {question.isRequired && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  <RadioGroup
                    value={formData.responses[question.id]?.toString() || ""}
                    onValueChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        responses: { ...prev.responses, [question.id]: value },
                      }));
                    }}
                  >
                    {(question.options as string[]).map(
                      (option: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
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
                      ),
                    )}
                  </RadioGroup>
                </>
              )}

            {question.type === "nummer" && (
              <FloatingInput
                label={question.text}
                id={`question_${question.id}`}
                name={`question_${question.id}`}
                type="number"
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
              <FloatingDatePicker
                label={question.text}
                name={`question_${question.id}`}
                value={formData.responses[question.id] || ""}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    responses: {
                      ...prev.responses,
                      [question.id]: value,
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
              <>
                <Label className="text-sm font-medium text-gray-900">
                  {question.text}
                  {question.isRequired && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const responseValue = formData.responses[question.id];
                    const currentRating = responseValue
                      ? Number(responseValue)
                      : 0;
                    const isActive = currentRating > 0 && star <= currentRating;

                    return (
                      <>
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              responses: {
                                ...prev.responses,
                                [question.id]: star,
                              },
                            }));
                          }}
                          className={`transition-colors hover:text-yellow-400 focus:outline-hidden ${isActive ? "text-yellow-500" : "text-gray-400"}`}
                        >
                          <Star
                            className="h-8 w-8"
                            fill={isActive ? "currentColor" : "none"}
                          />
                        </button>
                      </>
                    );
                  })}
                </div>
              </>
            )}

            {question.type === "humör" && (
              <>
                <Label className="text-sm font-medium text-gray-900">
                  {question.text}
                  {question.isRequired && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
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
              </>
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

      // Only require work task if work tasks are available
      if (workTasks.length > 0 && !formData.workTaskId)
        return false;

      // If work task has stations and work tasks are available, require station selection
      if (workTasks.length > 0 && formData.workTaskId) {
        const selectedWorkTask = workTasks.find(
          (task) => task.id === formData.workTaskId,
        );
        if (selectedWorkTask?.hasStations && !formData.workStationId)
          return false;
      }

      // Only require shift if shifts are available
      if (shifts.length > 0 && !formData.shiftId) return false;

      return true;
    }

    // For question steps (step 3 and above)
    if (currentStep >= 3) {
      const categoryIndex = currentStep - 3;
      const category = categoriesWithQuestions[categoryIndex];

      if (!category) return true; // If no category, allow proceed

      // Check that all required questions in current category are answered
      const categoryQuestions = questions.filter(
        (q) => q.categoryId === category.id,
      );
      for (const question of categoryQuestions) {
        if (question.isRequired) {
          const response = formData.responses[question.id];

          // For checkbox questions, require true (not just any value)
          if (question.type === "check") {
            if (response !== true) {
              return false;
            }
          } else {
            // For other question types, check for empty/null/undefined
            if (
              response === undefined ||
              response === null ||
              response === ""
            ) {
              return false;
            }
          }
        }
      }
      return true;
    }

    return true;
  };

  // Auto-hide URL bar on mobile when modal opens
  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    if (isOpen && isMobile) {
      // Set body to fullscreen mode
      const originalBodyStyle = {
        height: document.body.style.height,
        overflow: document.body.style.overflow,
        position: document.body.style.position,
      };

      // Apply fullscreen styles
      document.body.style.height = "100vh";
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.top = "0";

      // Force minimal-ui viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      const originalViewport = viewport?.getAttribute("content");
      if (viewport) {
        viewport.setAttribute(
          "content",
          "width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, minimal-ui",
        );
      }

      // Cleanup on modal close
      return () => {
        document.body.style.height = originalBodyStyle.height;
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.width = "";
        document.body.style.top = "";

        if (viewport && originalViewport) {
          viewport.setAttribute("content", originalViewport);
        }
      };
    }
  }, [isOpen]);

  // Get the selected checklist name for the title
  const selectedChecklist = checklists.find(
    (c) => c.id === formData.checklistId,
  );
  const modalTitle = selectedChecklist
    ? selectedChecklist.name
    : t("form.newControl");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto mobile-fullscreen">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="border-b border-border ">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {t("form.step")} {currentStep - 1} {t("form.of")} {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}% {t("form.complete")}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Modal Content */}
        <div className="">
          {renderStep()}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          {/* Mobile: Stack buttons vertically, Desktop: Previous on left */}
          <div className="order-1 sm:order-1">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 2}
              className={`w-full ${currentStep === 2 ? "invisible" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" />
              {t("form.previous")}
            </Button>
          </div>

          {/* Mobile: Full width buttons at top, Desktop: Right aligned */}
          <div className="flex flex-col sm:flex-row gap-3 order-2 sm:order-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
            >
              {t("admin.cancel")}
            </Button>
            <Button
              onClick={handleNext}
              disabled={submitMutation.isPending}
              className="w-full"
            >
              {currentStep === totalSteps + 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("form.submit")}
                </>
              ) : (
                <>
                  {t("form.next")}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

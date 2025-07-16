import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DeviationStatus } from "@shared/schema";
import { FileUploadSimple } from "./FileUploadSimple";
import { AttachmentList } from "./AttachmentList";
import { Checkbox } from "@/components/ui/checkbox";
import { FloatingInput } from "./ui/floatingInput";
import { FloatingTextarea } from "./ui/floatingTextarea";
import { FloatingSelect } from "./ui/floatingSelect";
import { FloatingDatePicker } from "./ui/floatingDatePicker";
interface DeviationType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomField {
  id: number;
  tenantId: number;
  name: string;
  fieldType: "text" | "number" | "checkbox" | "date" | "select";
  options?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CustomFieldValue {
  id: number;
  deviationId: number;
  customFieldId: number;
  value: string;
  createdAt: string;
  updatedAt: string;
  field: CustomField;
}

interface WorkTask {
  id: number;
  name: string;
}

interface WorkStation {
  id: number;
  name: string;
}

interface DeviationUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
}

interface DeviationPriority {
  id: number;
  tenantId: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
}

interface Deviation {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  deviationTypeId: number;
  priorityId?: number;
  statusId?: number;
  assignedToUserId?: number;
  createdByUserId: number;
  dueDate?: string;
  completedAt?: string;
  workTaskId?: number;
  locationId?: number;
  departmentId?: number;
  isHidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  deviation?: Deviation;
  mode?: "create" | "edit";
}

export default function DeviationModal({
  isOpen,
  onClose,
  onSuccess,
  deviation,
  mode = "create",
}: DeviationModalProps) {
  const { toast } = useToast();
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [createdDeviationId, setCreatedDeviationId] = useState<number | null>(
    null,
  );
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [customFieldValues, setCustomFieldValues] = useState<
    Record<number, string>
  >({});

  // Form state for controlled components
  const [formValues, setFormValues] = useState({
      title: "",
      description: "",
      workTaskId: "none",
      locationId: "none",
      priorityId: "none",
      statusId: "none",
      assignedToUserId: "none",
      departmentId: "none",
      isHidden: false,
  });
  const [customFieldsExpanded, setCustomFieldsExpanded] = useState(false);

  // Handle work task change - reset location when work task changes
  const handleWorkTaskChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      workTaskId: value,
      locationId: "none", // Reset location when work task changes
    }));
  };

  // Fetch deviation types
  const { data: deviationTypes = [], isLoading: typesLoading } = useQuery<
    DeviationType[]
  >({
    queryKey: ["/api/deviations/types"],
    enabled: isOpen,
  });

  // Fetch deviation priorities
  const { data: deviationPriorities = [], isLoading: prioritiesLoading } =
    useQuery<DeviationPriority[]>({
      queryKey: ["/api/deviations/priorities"],
      enabled: isOpen,
    });

  // Fetch deviation statuses
  const { data: deviationStatuses = [], isLoading: statusesLoading } = useQuery<
    DeviationStatus[]
  >({
    queryKey: ["/api/deviations/statuses"],
    enabled: isOpen,
  });

  // Fetch work tasks
  const { data: workTasks = [], isLoading: workTasksLoading } = useQuery<
    WorkTask[]
  >({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen,
  });

  // Fetch work stations
  const { data: workStations = [], isLoading: workStationsLoading } = useQuery<
    WorkStation[]
  >({
    queryKey: ["/api/work-stations"],
    enabled: isOpen,
  });

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<
    any[]
  >({
    queryKey: ["/api/departments"],
    enabled: isOpen,
  });

  // Fetch current user to check permissions
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: isOpen,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<
    DeviationUser[]
  >({
    queryKey: ["/api/users"],
    enabled: isOpen,
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/users");
        return response.json();
      } catch (error) {
        // If no access to users endpoint, return empty array
        console.warn("No access to users endpoint:", error);
        return [];
      }
    },
  });

  // Fetch deviation settings
  const { data: deviationSettings } = useQuery({
    queryKey: ["/api/deviations/settings"],
    enabled: isOpen,
  });

  // Fetch custom fields for selected deviation type
  const { data: customFields = [], isLoading: customFieldsLoading } = useQuery<
    CustomField[]
  >({
    queryKey: ["/api/deviation-types", selectedTypeId, "custom-fields"],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      const response = await apiRequest(
        "GET",
        `/api/deviation-types/${selectedTypeId}/custom-fields`,
      );
      return response.json();
    },
    enabled: !!selectedTypeId && isOpen,
  });

  // Fetch existing custom field values when editing
  const { data: existingCustomFieldValues = [] } = useQuery<CustomFieldValue[]>(
    {
      queryKey: ["/api/deviations", deviation?.id, "custom-field-values"],
      queryFn: async () => {
        if (!deviation?.id) return [];
        const response = await apiRequest(
          "GET",
          `/api/deviations/${deviation.id}/custom-field-values`,
        );
        return response.json();
      },
      enabled: !!deviation?.id && mode === "edit" && isOpen,
    },
  );

  // Filter work stations based on selected work task
  const filteredWorkStations = workStations.filter((station: any) => {
    if (formValues.workTaskId === "none" || formValues.workTaskId === "") {
      return false; // Don't show any stations if no work task is selected
    }
    return station.workTaskId === parseInt(formValues.workTaskId);
  });

  // Check if selected work task has any stations
  const selectedWorkTaskHasStations = filteredWorkStations.length > 0;

  // Check if all critical data is loaded
  const isDataLoading =
    typesLoading ||
    departmentsLoading ||
    statusesLoading ||
    prioritiesLoading ||
    workTasksLoading ||
    workStationsLoading ||
    usersLoading;

  // Initialize form data when modal opens or deviation data changes
  useEffect(() => {
    if (deviation) {
      console.log("Loading deviation data:", deviation);
      setSelectedTypeId(deviation.deviationTypeId);
      if (deviation.dueDate) {
        setSelectedDueDate(deviation.dueDate);
      }

      setFormValues({
        title: deviation.title || "",
        description: deviation.description || "",
        workTaskId: deviation.workTaskId?.toString() || "none",
        locationId: deviation.locationId?.toString() || "none",
        priorityId: deviation.priorityId?.toString() || "none",
        statusId: deviation.statusId?.toString() || "none",
        assignedToUserId: deviation.assignedToUserId?.toString() || "none",
        departmentId: deviation.departmentId?.toString() || "none",
        isHidden: deviation.isHidden || false,
      });
    }
else {
      setSelectedTypeId(null);
      setSelectedDueDate("");
      setCustomFieldValues({});
      // Reset form values for new deviation
      setFormValues({
        title: "",
        description: "",
        workTaskId: "",
        locationId: "",
        priorityId: "",
        statusId: "",
        assignedToUserId: "",
        departmentId: "",
        isHidden: false,
      });
    }
  }, [deviation, isOpen]);

  // Initialize custom field values when existing values are loaded
  useEffect(() => {
    if (existingCustomFieldValues.length > 0) {
      const values: Record<number, string> = {};
      existingCustomFieldValues.forEach((value) => {
        values[value.customFieldId] = value.value;
      });
      setCustomFieldValues(values);
    }
  }, [existingCustomFieldValues]);

  // Save custom field values mutation
  const saveCustomFieldValuesMutation = useMutation({
    mutationFn: async ({
      deviationId,
      fieldValues,
    }: {
      deviationId: number;
      fieldValues: Record<number, string>;
    }) => {
      const promises = Object.entries(fieldValues)
        .map(([fieldId, value]) => {
          if (value && value.trim()) {
            return apiRequest(
              "POST",
              `/api/deviations/${deviationId}/custom-field-values`,
              {
                customFieldId: parseInt(fieldId),
                value: value.trim(),
              },
            );
          }
          return null;
        })
        .filter(Boolean);

      await Promise.all(promises);
    },
    onError: (error) => {
      console.error("Error saving custom field values:", error);
    },
  });

  // Create deviation mutation
  const createDeviationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deviations", data);
      return response.json();
    },
    onSuccess: async (newDeviation) => {
      setCreatedDeviationId(newDeviation.id);

      // Save custom field values if any
      const hasCustomFieldValues = Object.keys(customFieldValues).some((key) =>
        customFieldValues[parseInt(key)]?.trim(),
      );
      if (hasCustomFieldValues) {
        await saveCustomFieldValuesMutation.mutateAsync({
          deviationId: newDeviation.id,
          fieldValues: customFieldValues,
        });
      }

      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        await uploadFiles(newDeviation.id);
      } else {
        // Complete the process if no files to upload
        completeCreation();
      }
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Det gick inte att skapa avvikelsen. Försök igen.",
        variant: "destructive",
      });
    },
  });

  // Update deviation mutation
  const updateDeviationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PATCH",
        `/api/deviations/${deviation?.id}`,
        data,
      );
      return response.json();
    },
    onSuccess: async () => {
      // Save custom field values if any
      if (deviation?.id) {
        const hasCustomFieldValues = Object.keys(customFieldValues).some((key) =>
          customFieldValues[parseInt(key)]?.trim(),
        );
        if (hasCustomFieldValues) {
          await saveCustomFieldValuesMutation.mutateAsync({
            deviationId: deviation.id,
            fieldValues: customFieldValues,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/deviations/${deviation?.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/stats"] });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/deviations/${deviation?.id}/custom-field-values`],
      });
      onClose();
      toast({
        title: "Avvikelse uppdaterad",
        description: "Avvikelsen har uppdaterats framgångsrikt.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Det gick inte att uppdatera avvikelsen. Försök igen.",
        variant: "destructive",
      });
    },
  });

  const uploadFiles = async (deviationId: number) => {
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `/api/deviations/${deviationId}/attachments`,
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      completeCreation();
    } catch (error) {
      console.error("File upload error:", error);
      toast({
        title: "Varning",
        description:
          "Avvikelsen skapades men filuppladdningen misslyckades. Du kan lägga till filer senare.",
        variant: "destructive",
      });
      completeCreation();
    }
  };

  const completeCreation = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
    onClose();
    setSelectedFiles([]);
    setCreatedDeviationId(null);
    toast({
      title: "Avvikelse skapad",
      description:
        selectedFiles.length > 0
          ? `Avvikelsen har skapats med ${selectedFiles.length} fil(er).`
          : "En ny avvikelse har skapats framgångsrikt.",
    });
    onSuccess?.();
  };

  const handleSubmit = () => {
    // Validate all required fields
    const missingFields: string[] = [];
    
    // Check basic required fields
    if (!formValues.title?.trim()) {
      missingFields.push("Titel");
    }
    if (!formValues.description?.trim()) {
      missingFields.push("Beskrivning");
    }
    if (!selectedTypeId) {
      missingFields.push("Avvikelsetyp");
    }
    
    // Check required custom fields
    const missingRequiredCustomFields = customFields
      .filter((f) => f.isRequired)
      .filter((f) => !customFieldValues[f.id]?.trim());
    
    if (missingRequiredCustomFields.length > 0) {
      missingRequiredCustomFields.forEach(field => {
        missingFields.push(`Extrafält: ${field.name}`);
      });
      setCustomFieldsExpanded(true);
    }
    
    // Show toast if there are missing fields
    if (missingFields.length > 0) {
      toast({
        title: "Obligatoriska fält saknas",
        description: `Följande fält måste fyllas i: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    const data = {
      title: formValues.title,
      description: formValues.description,
      deviationTypeId: selectedTypeId!,
      priorityId: formValues.priorityId !== "none" ? parseInt(formValues.priorityId) : undefined,
      statusId: formValues.statusId !== "none" ? parseInt(formValues.statusId) : undefined,
      workTaskId: formValues.workTaskId !== "none" ? parseInt(formValues.workTaskId) : undefined,
      locationId: formValues.locationId !== "none" ? parseInt(formValues.locationId) : undefined,
      departmentId: formValues.departmentId !== "none" ? parseInt(formValues.departmentId) : undefined,
      assignedToUserId: formValues.assignedToUserId !== "none" ? parseInt(formValues.assignedToUserId) : undefined,
      dueDate: selectedDueDate || undefined,
      isHidden: formValues.isHidden || false,
    };

    if (mode === "edit") {
      updateDeviationMutation.mutate(data);
    } else {
      createDeviationMutation.mutate(data);
    }
  };

  // Check if form is submitting
  const isSubmitting =
    createDeviationMutation.isPending || updateDeviationMutation.isPending;

  // Auto-hide URL bar on mobile when modal opens
  useEffect(() => {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isOpen && isMobile) {
      // Set body to fullscreen mode
      const originalBodyStyle = {
        height: document.body.style.height,
        overflow: document.body.style.overflow,
        position: document.body.style.position,
      };

      // Apply fullscreen styles
      document.body.style.height = '100vh';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = '0';

      // Force minimal-ui viewport
      const viewport = document.querySelector('meta[name="viewport"]');
      const originalViewport = viewport?.getAttribute('content');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no, minimal-ui');
      }

      // Cleanup on modal close
      return () => {
        document.body.style.height = originalBodyStyle.height;
        document.body.style.overflow = originalBodyStyle.overflow;
        document.body.style.position = originalBodyStyle.position;
        document.body.style.width = '';
        document.body.style.top = '';
        
        if (viewport && originalViewport) {
          viewport.setAttribute('content', originalViewport);
        }
      };
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="w-full max-h-screen overflow-y-auto max-w-none rounded-none sm:max-w-3xl sm:rounded-lg mobile-fullscreen">
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-9999 flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-3 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {mode === "edit"
                  ? "Uppdaterar avvikelse..."
                  : "Skapar avvikelse..."}
              </p>
            </div>
          </div>
        )}

        <DialogHeader className="pt-3">
          <DialogTitle>
            {mode === "edit" ? "Redigera avvikelse" : "Skapa ny avvikelse"}
          </DialogTitle>
        </DialogHeader>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(); // Utan FormData
          }}
          className="space-y-4 p-2"
        >
          <div className="space-y-4">
            <div className="w-full">
              <FloatingInput
                id="title"
                name="title"
                label="Rubrik"
                required
                value={formValues.title}
                className="w-full"
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>

            <div className="w-full">
              <FloatingTextarea
                label="Beskrivning"
                id="description"
                name="description"
                required
                value={formValues.description}
                className="w-full"
                onChange={(e) =>
                  setFormValues((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FloatingSelect
                label="Avvikelsestyp"
                name="deviationTypeId"
                value={selectedTypeId?.toString() || ""}
                onChange={(value) => setSelectedTypeId(parseInt(value))}
                required
                disabled={typesLoading}
                placeholder={typesLoading ? "Laddar..." : "Välj typ"}
              >
                {deviationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      {type.name}
                    </div>
                  </SelectItem>
                ))}
              </FloatingSelect>
            </div>

            <div>
              <FloatingSelect
                label="Avdelning"
                name="departmentId"
                value={formValues.departmentId}
                onChange={(value) =>
                  setFormValues((prev) => ({ ...prev, departmentId: value }))
                }
                required
                disabled={departmentsLoading}
                placeholder={
                  departmentsLoading ? "Laddar..." : "Välj avdelning"
                }
                className="w-full"
              >
                {departments
                  .filter((dept: any) => dept.isActive)
                  .map((department: any) => (
                    <SelectItem
                      key={department.id}
                      value={department.id.toString()}
                    >
                      {department.name}
                    </SelectItem>
                  ))}
              </FloatingSelect>
            </div>
            {/* Priority - only show if enabled in settings */}
            {deviationSettings?.usePriorities && (
              <div>
                <FloatingSelect
                  label="Prioritet"
                  name="priorityId"
                  value={formValues.priorityId}
                  onChange={(value) =>
                    setFormValues((prev) => ({ ...prev, priorityId: value }))
                  }
                  disabled={prioritiesLoading}
                  placeholder={
                    prioritiesLoading ? "Laddar..." : "Välj prioritet"
                  }
                >
                  <SelectItem value="none">Ingen prioritet</SelectItem>
                  {deviationPriorities
                    .filter((priority) => priority.isActive)
                    .map((priority) => (
                      <SelectItem
                        key={priority.id}
                        value={priority.id.toString()}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          {priority.name}
                        </div>
                      </SelectItem>
                    ))}
                </FloatingSelect>
              </div>
            )}
            {/* Work Task - only show if enabled in settings */}
            {deviationSettings?.useWorkTasks && (
              <div>
                <FloatingSelect
                  label="Arbetsuppgift"
                  name="workTaskId"
                  value={formValues.workTaskId}
                  onChange={handleWorkTaskChange}
                  disabled={workTasksLoading}
                  placeholder={
                    workTasksLoading ? "Laddar..." : "Välj arbetsuppgift"
                  }
                >
                  <SelectItem value="none">Ingen arbetsuppgift</SelectItem>
                  {workTasks.map((task: any) => (
                    <SelectItem key={task.id} value={task.id.toString()}>
                      {task.name}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            )}

            {/* Location/Work Station - only show if enabled in settings and work task is selected with stations */}
            {deviationSettings?.useWorkStations &&
              formValues.workTaskId !== "none" &&
              formValues.workTaskId !== "" &&
              selectedWorkTaskHasStations && (
                <div>
                  <FloatingSelect
                    label="Plats/Station"
                    name="locationId"
                    value={formValues.locationId}
                    onChange={(value) =>
                      setFormValues((prev) => ({ ...prev, locationId: value }))
                    }
                    disabled={workStationsLoading}
                    placeholder={
                      workStationsLoading ? "Laddar..." : "Välj plats"
                    }
                  >
                    <SelectItem value="none">Ingen plats</SelectItem>
                    {filteredWorkStations.map((station: any) => (
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

            {/* Status - only for edit mode */}
            {mode === "edit" && (
              <div>
                <FloatingSelect
                  label="Status"
                  name="statusId"
                  value={formValues.statusId}
                  onChange={(value) =>
                    setFormValues((prev) => ({ ...prev, statusId: value }))
                  }
                  disabled={statusesLoading}
                  placeholder={statusesLoading ? "Laddar..." : "Välj status"}
                >
                  {deviationStatuses
                    .filter((status) => status.isActive)
                    .map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.name}
                        </div>
                      </SelectItem>
                    ))}
                </FloatingSelect>
              </div>
            )}

            {/* Assigned User - only for edit mode */}
            {mode === "edit" && (
              <div>
                <FloatingSelect
                  label="Tilldelad till"
                  name="assignedToUserId"
                  value={formValues.assignedToUserId}
                  onChange={(value) =>
                    setFormValues((prev) => ({
                      ...prev,
                      assignedToUserId: value,
                    }))
                  }
                  disabled={usersLoading}
                  placeholder={usersLoading ? "Laddar..." : "Välj användare"}
                >
                  <SelectItem value="none">Ingen tilldelning</SelectItem>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </SelectItem>
                  ))}
                </FloatingSelect>
              </div>
            )}

            {/* Due Date - only for edit mode */}
            {mode === "edit" && (
              <div>
                <FloatingDatePicker
                  label="Förfallodatum"
                  name="dueDate"
                  value={selectedDueDate}
                  onChange={(value) => setSelectedDueDate(value)}
                  placeholder="Välj förfallodatum"
                />
              </div>
            )}

            {customFields.length > 0 && (
              <div className="col-span-1 sm:col-span-2">
                <details open={customFieldsExpanded} className="border rounded-md p-4">
                  <summary onClick={() => setCustomFieldsExpanded((prev) => !prev)} className="cursor-pointer font-medium text-sm">
                    Extrafält
                    {customFields.some((f) => f.isRequired) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </summary>
                  <div className="space-y-4 mt-4">
                    {customFields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <div key={field.id} className="space-y-1 sm:space-y-2">
                          {field.fieldType === "text" && (
                            <FloatingInput
                              label={`${field.name}`}
                              id={`custom_field_${field.id}`}
                              name={`custom_field_${field.id}`}
                              value={customFieldValues[field.id] || ""}
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                              required={field.isRequired}
                              className="w-full"
                            />
                          )}

                          {field.fieldType === "number" && (
                            <FloatingInput
                              label={`${field.name}`}
                              id={`custom_field_${field.id}`}
                              name={`custom_field_${field.id}`}
                              value={customFieldValues[field.id] || ""}
                              type="number"
                              onChange={(e) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: e.target.value,
                                }))
                              }
                              required={field.isRequired}
                              className="w-full"
                            />
                          )}

                          {field.fieldType === "checkbox" && (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`custom_field_${field.id}`}
                                checked={customFieldValues[field.id] === "true"}
                                onCheckedChange={(checked) =>
                                  setCustomFieldValues((prev) => ({
                                    ...prev,
                                    [field.id]: checked ? "true" : "false",
                                  }))
                                }
                              />
                              <Label
                                htmlFor={`custom_field_${field.id}`}
                                className="text-sm font-normal"
                              >
                                {field.name}
                              </Label>
                            </div>
                          )}

                          {field.fieldType === "date" && (
                            <FloatingDatePicker
                              label={field.name}
                              name={`custom_field_${field.id}`}
                              value={customFieldValues[field.id] || ""}
                              onChange={(value) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: value,
                                }))
                              }
                              placeholder="Välj datum"
                              className="w-full"
                              required={field.isRequired}
                            />
                          )}

                          {field.fieldType === "select" && field.options && (
                            <FloatingSelect
                              label={field.name}
                              name={`custom_field_${field.id}`}
                              value={customFieldValues[field.id] || ""}
                              onChange={(value) =>
                                setCustomFieldValues((prev) => ({
                                  ...prev,
                                  [field.id]: value,
                                }))
                              }
                              required={field.isRequired}
                              placeholder={`Välj ${field.name.toLowerCase()}`}
                            >
                              {field.options.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </FloatingSelect>
                          )}
                        </div>
                      ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          {mode === "create" && (
            <div className="space-y-2 sm:space-y-4">
              <FileUploadSimple
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={5}
                maxSize={10}
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex gap-3">
              <Checkbox
                id="isHidden"
                name="isHidden"
                defaultChecked={deviation?.isHidden || false}
              />
              <div>
                <Label htmlFor="isHidden">Dölj avvikelse</Label>
                <p className="text-xs text-muted-foreground">
                  Endast synlig för admin, avdelningsansvarig och tilldelad
                  person
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isDataLoading || isSubmitting}>
                {isSubmitting
                  ? mode === "edit"
                    ? "Uppdaterar..."
                    : "Skapar..."
                  : isDataLoading
                    ? "Laddar..."
                    : mode === "edit"
                      ? "Uppdatera avvikelse"
                      : "Skapa avvikelse"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

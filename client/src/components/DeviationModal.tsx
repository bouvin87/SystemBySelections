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
  fieldType: 'text' | 'number' | 'checkbox' | 'date' | 'select';
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
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, string>>({});

  // Fetch deviation types
  const { data: deviationTypes = [], isLoading: typesLoading } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
    enabled: isOpen,
  });

  // Fetch deviation priorities
  const { data: deviationPriorities = [], isLoading: prioritiesLoading } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
    enabled: isOpen,
  });

  // Fetch deviation statuses
  const { data: deviationStatuses = [], isLoading: statusesLoading } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
    enabled: isOpen,
  });

  // Fetch work tasks
  const { data: workTasks = [], isLoading: workTasksLoading } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen,
  });

  // Fetch work stations
  const { data: workStations = [], isLoading: workStationsLoading } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: isOpen,
  });

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    enabled: isOpen,
  });

  // Fetch current user to check permissions
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: isOpen,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<DeviationUser[]>({
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
  const { data: customFields = [], isLoading: customFieldsLoading } = useQuery<CustomField[]>({
    queryKey: ["/api/deviation-types", selectedTypeId, "custom-fields"],
    queryFn: async () => {
      if (!selectedTypeId) return [];
      const response = await apiRequest("GET", `/api/deviation-types/${selectedTypeId}/custom-fields`);
      return response.json();
    },
    enabled: !!selectedTypeId && isOpen,
  });

  // Fetch existing custom field values when editing
  const { data: existingCustomFieldValues = [] } = useQuery<CustomFieldValue[]>({
    queryKey: ["/api/deviations", deviation?.id, "custom-field-values"],
    queryFn: async () => {
      if (!deviation?.id) return [];
      const response = await apiRequest("GET", `/api/deviations/${deviation.id}/custom-field-values`);
      return response.json();
    },
    enabled: !!deviation?.id && mode === "edit" && isOpen,
  });

  // Check if all critical data is loaded
  const isDataLoading = typesLoading || departmentsLoading || statusesLoading || prioritiesLoading || workTasksLoading || workStationsLoading || usersLoading;

  // Initialize form data when modal opens or deviation data changes
  useEffect(() => {
    if (deviation) {
      setSelectedTypeId(deviation.deviationTypeId);
      if (deviation.dueDate) {
        setSelectedDueDate(deviation.dueDate);
      }
    } else {
      setSelectedTypeId(null);
      setSelectedDueDate("");
      setCustomFieldValues({});
    }
  }, [deviation, isOpen]);

  // Initialize custom field values when existing values are loaded
  useEffect(() => {
    if (existingCustomFieldValues.length > 0) {
      const values: Record<number, string> = {};
      existingCustomFieldValues.forEach(value => {
        values[value.customFieldId] = value.value;
      });
      setCustomFieldValues(values);
    }
  }, [existingCustomFieldValues]);

  // Save custom field values mutation
  const saveCustomFieldValuesMutation = useMutation({
    mutationFn: async ({ deviationId, fieldValues }: { deviationId: number, fieldValues: Record<number, string> }) => {
      const promises = Object.entries(fieldValues).map(([fieldId, value]) => {
        if (value.trim()) {
          return apiRequest("POST", `/api/deviations/${deviationId}/custom-field-values`, {
            customFieldId: parseInt(fieldId),
            value: value.trim()
          });
        }
      }).filter(Boolean);
      
      await Promise.all(promises);
    },
    onError: (error) => {
      console.error('Error saving custom field values:', error);
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
      const hasCustomFieldValues = Object.keys(customFieldValues).some(key => customFieldValues[parseInt(key)]?.trim());
      if (hasCustomFieldValues) {
        await saveCustomFieldValuesMutation.mutateAsync({ 
          deviationId: newDeviation.id, 
          fieldValues: customFieldValues 
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/deviations/${deviation?.id}`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/stats"] });
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

  const handleSubmit = (formData: FormData) => {
    const data = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      deviationTypeId: parseInt(formData.get("deviationTypeId") as string),
      priorityId: formData.get("priorityId")
        ? parseInt(formData.get("priorityId") as string)
        : undefined,
      statusId: formData.get("statusId")
        ? parseInt(formData.get("statusId") as string)
        : undefined,
      workTaskId:
        formData.get("workTaskId") && formData.get("workTaskId") !== "0"
          ? parseInt(formData.get("workTaskId") as string)
          : undefined,
      locationId:
        formData.get("locationId") && formData.get("locationId") !== "0"
          ? parseInt(formData.get("locationId") as string)
          : undefined,
      departmentId:
        formData.get("departmentId") && formData.get("departmentId") !== "0"
          ? parseInt(formData.get("departmentId") as string)
          : undefined,
      assignedToUserId:
        formData.get("assignedToUserId") &&
        formData.get("assignedToUserId") !== "0"
          ? parseInt(formData.get("assignedToUserId") as string)
          : undefined,
      dueDate:
        formData.get("dueDate") && formData.get("dueDate") !== ""
          ? (formData.get("dueDate") as string)
          : undefined,
      isHidden: formData.get("isHidden") === "on",
    };

    if (mode === "edit") {
      updateDeviationMutation.mutate(data);
    } else {
      createDeviationMutation.mutate(data);
    }
  };

  // Check if form is submitting
  const isSubmitting = createDeviationMutation.isPending || updateDeviationMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="max-w-2xl">
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-3 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {mode === "edit" ? "Uppdaterar avvikelse..." : "Skapar avvikelse..."}
              </p>
            </div>
          </div>
        )}
        
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Redigera avvikelse" : "Skapa ny avvikelse"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(new FormData(e.currentTarget));
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={deviation?.title || ""}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={deviation?.description || ""}
              />
            </div>

            <div>
              <Label htmlFor="deviationTypeId">Avvikelsetyp *</Label>
              <Select
                name="deviationTypeId"
                required
                defaultValue={deviation?.deviationTypeId?.toString()}
                disabled={typesLoading}
                onValueChange={(value) => setSelectedTypeId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={typesLoading ? "Laddar..." : "Välj typ"} />
                </SelectTrigger>
                <SelectContent>
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
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="departmentId">Avdelning *</Label>
              <Select
                name="departmentId"
                required
                defaultValue={deviation?.departmentId?.toString()}
                disabled={departmentsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={departmentsLoading ? "Laddar..." : "Välj avdelning"} />
                </SelectTrigger>
                <SelectContent>
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
                </SelectContent>
              </Select>
            </div>

            {/* Custom Fields Section */}
            {customFields.length > 0 && (
              <div className="col-span-2">
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-gray-700">Extrafält</h4>
                  {customFields
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id}>
                        <Label htmlFor={`custom_field_${field.id}`}>
                          {field.name}
                          {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        
                        {field.fieldType === 'text' && (
                          <Input
                            id={`custom_field_${field.id}`}
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({
                              ...prev,
                              [field.id]: e.target.value
                            }))}
                            required={field.isRequired}
                            placeholder={`Ange ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {field.fieldType === 'number' && (
                          <Input
                            id={`custom_field_${field.id}`}
                            type="number"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({
                              ...prev,
                              [field.id]: e.target.value
                            }))}
                            required={field.isRequired}
                            placeholder={`Ange ${field.name.toLowerCase()}`}
                          />
                        )}
                        
                        {field.fieldType === 'checkbox' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`custom_field_${field.id}`}
                              checked={customFieldValues[field.id] === 'true'}
                              onCheckedChange={(checked) => setCustomFieldValues(prev => ({
                                ...prev,
                                [field.id]: checked ? 'true' : 'false'
                              }))}
                            />
                            <Label htmlFor={`custom_field_${field.id}`} className="text-sm font-normal">
                              {field.name}
                            </Label>
                          </div>
                        )}
                        
                        {field.fieldType === 'date' && (
                          <Input
                            id={`custom_field_${field.id}`}
                            type="date"
                            value={customFieldValues[field.id] || ''}
                            onChange={(e) => setCustomFieldValues(prev => ({
                              ...prev,
                              [field.id]: e.target.value
                            }))}
                            required={field.isRequired}
                          />
                        )}
                        
                        {field.fieldType === 'select' && field.options && (
                          <Select
                            value={customFieldValues[field.id] || ''}
                            onValueChange={(value) => setCustomFieldValues(prev => ({
                              ...prev,
                              [field.id]: value
                            }))}
                            required={field.isRequired}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Välj ${field.name.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option, index) => (
                                <SelectItem key={index} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {mode === "edit" && (
              <div>
                <Label htmlFor="statusId">Status</Label>
                <Select
                  name="statusId"
                  defaultValue={deviation?.statusId?.toString() || ""}
                  disabled={statusesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={statusesLoading ? "Laddar..." : "Välj status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {deviationStatuses
                      ?.filter((status: DeviationStatus) => status.isActive)
                      ?.sort(
                        (a: DeviationStatus, b: DeviationStatus) =>
                          a.order - b.order,
                      )
                      ?.map((status: DeviationStatus) => (
                        <SelectItem
                          key={status.id}
                          value={status.id.toString()}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: status.color || "#10b981",
                              }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(deviationSettings?.usePriorities ?? true) && (
              <div>
                <Label htmlFor="priorityId">Prioritet</Label>
                <Select
                  name="priorityId"
                  defaultValue={deviation?.priorityId?.toString() || ""}
                  disabled={prioritiesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={prioritiesLoading ? "Laddar..." : "Välj prioritet"} />
                  </SelectTrigger>
                  <SelectContent>
                    {deviationPriorities
                      .filter((priority) => priority.isActive)
                      .sort((a, b) => a.order - b.order)
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
                  </SelectContent>
                </Select>
              </div>
            )}

            {(deviationSettings?.useWorkTasks ?? true) && (
              <div>
                <Label htmlFor="workTaskId">Arbetsmoment</Label>
                <Select
                  name="workTaskId"
                  defaultValue={deviation?.workTaskId?.toString() || "0"}
                  disabled={workTasksLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={workTasksLoading ? "Laddar..." : "Välj arbetsmoment"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ingen vald</SelectItem>
                    {workTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {mode === "edit" && (
              <div>
                <Label htmlFor="assignedToUserId">Tilldela till</Label>
                <Select
                  name="assignedToUserId"
                  defaultValue={deviation?.assignedToUserId?.toString() || ""}
                  disabled={usersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={usersLoading ? "Laddar..." : "Välj användare"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ingen vald</SelectItem>
                    {users
                      .filter((user) => user.isActive)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(deviationSettings?.useWorkStations ?? true) && (
              <div>
                <Label htmlFor="locationId">Plats</Label>
                <Select
                  name="locationId"
                  defaultValue={deviation?.locationId?.toString() || "0"}
                  disabled={workStationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={workStationsLoading ? "Laddar..." : "Välj plats"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ingen vald</SelectItem>
                    {workStations.map((station) => (
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

            {mode === "edit" && (
              <div>
                <Label htmlFor="dueDate">Deadline</Label>
                <DatePicker
                  value={
                    selectedDueDate !== ""
                      ? selectedDueDate
                      : deviation?.dueDate
                        ? new Date(deviation.dueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                  }
                  onChange={(value) => {
                    setSelectedDueDate(value);
                  }}
                  placeholder="Välj deadline"
                />
                <input
                  type="hidden"
                  name="dueDate"
                  value={
                    selectedDueDate !== ""
                      ? selectedDueDate
                      : deviation?.dueDate
                        ? new Date(deviation.dueDate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                  }
                />
              </div>
            )}

            {/* Hidden checkbox - Only for users with permission */}
          </div>
          {/* File Upload Section - Only for Create Mode */}
          {mode === "create" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bilagor</h3>
              <FileUploadSimple
                selectedFiles={selectedFiles}
                onFilesChange={setSelectedFiles}
                maxFiles={5}
                maxSize={10}
              />
            </div>
          )}

          <div className="flex justify-between items-start pt-4 gap-4">
            {/* Vänster sektion med checkbox och beskrivning */}
            <div className="flex gap-2 max-w-md">
              <div className="pt-3">
                <Checkbox
                  id="isHidden"
                  name="isHidden"
                  defaultChecked={deviation?.isHidden || false}
                />
              </div>
              <div>
                <Label htmlFor="isHidden" className="text-sm font-medium">
                  Dölj avvikelse
                </Label>
                <p className="text-xs text-muted-foreground">
                  Endast synlig för admin, avdelningsansvarig och tilldelad person
                </p>
              </div>
            </div>

            {/* Höger sektion med knappar */}
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={isDataLoading || isSubmitting}
              >
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

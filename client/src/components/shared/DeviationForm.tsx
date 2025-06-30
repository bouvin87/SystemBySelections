import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { FileUpload } from "@/components/FileUpload";
import { AttachmentList } from "@/components/AttachmentList";
import { CustomFieldsList } from "@/components/CustomFieldsList";

// Schema för avvikelseformulär
const deviationSchema = z.object({
  title: z.string().min(1, "Titel är obligatorisk"),
  description: z.string().min(1, "Beskrivning är obligatorisk"),
  deviationTypeId: z.number().min(1, "Avvikelsetyp är obligatorisk"),
  priorityId: z.number().optional(),
  statusId: z.number().optional(),
  assigneeId: z.number().optional(),
  departmentId: z.number().optional(),
  workTaskId: z.number().optional(),
  workStationId: z.number().optional(),
  dueDate: z.string().optional(),
  isHidden: z.boolean().optional(),
});

type DeviationFormData = z.infer<typeof deviationSchema>;

interface DeviationFormProps {
  deviation?: any;
  onSuccess: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  showAttachments?: boolean;
}

export function DeviationForm({ 
  deviation, 
  onSuccess, 
  onCancel, 
  isSubmitting: externalSubmitting,
  showAttachments = true 
}: DeviationFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedWorkTaskId, setSelectedWorkTaskId] = useState<number | null>(
    deviation?.workTaskId || null
  );
  const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});

  // Form setup
  const form = useForm<DeviationFormData>({
    resolver: zodResolver(deviationSchema),
    defaultValues: {
      title: deviation?.title || "",
      description: deviation?.description || "",
      deviationTypeId: deviation?.deviationTypeId || 0,
      priorityId: deviation?.priorityId || 0,
      statusId: deviation?.statusId || 0,
      assigneeId: deviation?.assigneeId || 0,
      departmentId: deviation?.departmentId || 0,
      workTaskId: deviation?.workTaskId || 0,
      workStationId: deviation?.workStationId || 0,
      dueDate: deviation?.dueDate?.split('T')[0] || "",
      isHidden: deviation?.isHidden || false,
    },
  });

  // Data queries
  const { data: deviationTypes = [] } = useQuery({
    queryKey: ["/api/deviations/types"],
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ["/api/deviations/priorities"],
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["/api/deviations/statuses"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
  });

  const { data: workTasks = [] } = useQuery({
    queryKey: ["/api/work-tasks"],
  });

  const { data: workStations = [] } = useQuery({
    queryKey: ["/api/work-stations"],
  });

  // Filtered work stations based on selected work task
  const filteredWorkStations = workStations.filter((station: any) => {
    if (!selectedWorkTaskId) return true;
    return station.workTaskId === selectedWorkTaskId;
  });

  // Custom fields for selected deviation type
  const { data: customFields = [] } = useQuery({
    queryKey: ["/api/deviation-types", form.watch("deviationTypeId"), "custom-fields"],
    enabled: !!form.watch("deviationTypeId"),
  });

  // Load existing custom field values if editing
  const { data: existingCustomFieldValues = [] } = useQuery({
    queryKey: ["/api/deviations", deviation?.id, "custom-field-values"],
    enabled: !!deviation?.id,
  });

  useEffect(() => {
    if (existingCustomFieldValues.length > 0) {
      const values: Record<number, any> = {};
      existingCustomFieldValues.forEach((value: any) => {
        values[value.customFieldId] = value.value;
      });
      setCustomFieldValues(values);
    }
  }, [existingCustomFieldValues]);

  // Mutations
  const createDeviationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/deviations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create deviation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      toast({ title: "Avvikelse skapad", description: "Avvikelsen har skapats framgångsrikt" });
      onSuccess();
    },
  });

  const updateDeviationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/deviations/${deviation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update deviation");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      toast({ title: "Avvikelse uppdaterad", description: "Avvikelsen har uppdaterats framgångsrikt" });
      onSuccess();
    },
  });

  const isSubmitting = externalSubmitting || createDeviationMutation.isPending || updateDeviationMutation.isPending;

  const validateForm = (): boolean => {
    const formData = form.getValues();
    const errors: string[] = [];

    if (!formData.title?.trim()) errors.push("Titel");
    if (!formData.description?.trim()) errors.push("Beskrivning");
    if (!formData.deviationTypeId || formData.deviationTypeId === 0) errors.push("Avvikelsetyp");

    // Validate required custom fields
    customFields.forEach((field: any) => {
      if (field.isRequired && !customFieldValues[field.id]) {
        errors.push(field.name);
      }
    });

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

  const onSubmit = async (data: DeviationFormData) => {
    if (!validateForm()) return;

    const submissionData = {
      ...data,
      priorityId: data.priorityId === 0 ? null : data.priorityId,
      statusId: data.statusId === 0 ? null : data.statusId,
      assigneeId: data.assigneeId === 0 ? null : data.assigneeId,
      departmentId: data.departmentId === 0 ? null : data.departmentId,
      workTaskId: data.workTaskId === 0 ? null : data.workTaskId,
      workStationId: data.workStationId === 0 ? null : data.workStationId,
      dueDate: data.dueDate || null,
      customFieldValues,
    };

    if (deviation) {
      updateDeviationMutation.mutate(submissionData);
    } else {
      createDeviationMutation.mutate(submissionData);
    }
  };

  const canHide = user?.role === "admin" || user?.role === "superadmin";

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Titel */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titel *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Titel på avvikelsen" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Beskrivning */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Beskrivning *</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Detaljerad beskrivning av avvikelsen" rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Avvikelsetyp */}
          <FormField
            control={form.control}
            name="deviationTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avvikelsetyp *</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj avvikelsetyp" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Välj avvikelsetyp</SelectItem>
                    {deviationTypes.map((type: any) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Prioritet */}
          <FormField
            control={form.control}
            name="priorityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioritet</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj prioritet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen prioritet</SelectItem>
                    {priorities.map((priority: any) => (
                      <SelectItem key={priority.id} value={priority.id.toString()}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="statusId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen status</SelectItem>
                    {statuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ansvarig */}
          <FormField
            control={form.control}
            name="assigneeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ansvarig</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj ansvarig" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen ansvarig</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Avdelning */}
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avdelninga</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj avdelning" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen avdelningss</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Arbetsuppgift */}
          <FormField
            control={form.control}
            name="workTaskId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arbetsuppgift</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const taskId = parseInt(value);
                    field.onChange(taskId);
                    setSelectedWorkTaskId(taskId === 0 ? null : taskId);
                    // Reset work station when work task changes
                    if (taskId === 0) {
                      form.setValue("workStationId", 0);
                    }
                  }} 
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj arbetsuppgift" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen arbetsuppgift</SelectItem>
                    {workTasks.map((task: any) => (
                      <SelectItem key={task.id} value={task.id.toString()}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Arbetsstation */}
          <FormField
            control={form.control}
            name="workStationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arbetsstation</FormLabel>
                <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Välj arbetsstation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0">Ingen arbetsstation</SelectItem>
                    {filteredWorkStations.map((station: any) => (
                      <SelectItem key={station.id} value={station.id.toString()}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Förfallodatum */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Förfallodatum</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dölj avvikelse (endast för admin) */}
          {canHide && (
            <FormField
              control={form.control}
              name="isHidden"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Dölj avvikelse</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Endast synlig för administratörer, skapare, ansvarig och avdelningschef
                    </p>
                  </div>
                </FormItem>
              )}
            />
          )}

          {/* Custom fields */}
          {customFields.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Extrafält</h3>
              <CustomFieldsList
                customFields={customFields}
                values={customFieldValues}
                onChange={setCustomFieldValues}
              />
            </div>
          )}

          {/* File attachments for existing deviations */}
          {deviation && showAttachments && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Bilagor</h3>
              <FileUpload deviationId={deviation.id} />
              <AttachmentList deviationId={deviation.id} />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sparar..." : deviation ? "Uppdatera" : "Skapa"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
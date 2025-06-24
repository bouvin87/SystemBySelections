import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DeviationStatus } from "@shared/schema";

interface DeviationType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  deviation?: Deviation;
  mode?: 'create' | 'edit';
}

export default function DeviationModal({ isOpen, onClose, onSuccess, deviation, mode = 'create' }: DeviationModalProps) {
  const { toast } = useToast();
  const [selectedDueDate, setSelectedDueDate] = useState<string>("");

  // Fetch deviation types
  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
    enabled: isOpen,
  });

  // Fetch deviation priorities
  const { data: deviationPriorities = [] } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
    enabled: isOpen,
  });

  // Fetch deviation statuses
  const { data: deviationStatuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
    enabled: isOpen,
  });



  // Fetch work tasks
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
    enabled: isOpen,
  });

  // Fetch work stations
  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
    enabled: isOpen,
  });

  // Fetch departments
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    enabled: isOpen,
  });

  // Fetch users
  const { data: users = [] } = useQuery<DeviationUser[]>({
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
    queryKey: ['/api/deviations/settings'],
    enabled: isOpen
  });

  // Create deviation mutation
  const createDeviationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/deviations", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deviations/stats"] });
      onClose();
      toast({
        title: "Avvikelse skapad",
        description: "Avvikelsen har skapats framgångsrikt.",
      });
      onSuccess?.();
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
      const response = await apiRequest("PATCH", `/api/deviations/${deviation?.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deviations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/deviations/${deviation?.id}`] });
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

  const handleSubmit = (formData: FormData) => {
    const data = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      deviationTypeId: parseInt(formData.get("deviationTypeId") as string),
      priorityId: formData.get("priorityId") ? parseInt(formData.get("priorityId") as string) : undefined,


      workTaskId: formData.get("workTaskId") && formData.get("workTaskId") !== "0" ? parseInt(formData.get("workTaskId") as string) : undefined,
      locationId: formData.get("locationId") && formData.get("locationId") !== "0" ? parseInt(formData.get("locationId") as string) : undefined,
      departmentId: formData.get("departmentId") && formData.get("departmentId") !== "0" ? parseInt(formData.get("departmentId") as string) : undefined,
      assignedToUserId: formData.get("assignedToUserId") && formData.get("assignedToUserId") !== "0" ? parseInt(formData.get("assignedToUserId") as string) : undefined,
      dueDate: formData.get("dueDate") && formData.get("dueDate") !== "" ? formData.get("dueDate") as string : undefined,
    };

    if (mode === 'edit') {
      updateDeviationMutation.mutate(data);
    } else {
      createDeviationMutation.mutate(data);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Redigera avvikelse' : 'Skapa ny avvikelse'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(new FormData(e.currentTarget));
        }} className="space-y-4">
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
              <Select name="deviationTypeId" required defaultValue={deviation?.deviationTypeId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj typ" />
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
              <Select name="departmentId" required defaultValue={deviation?.departmentId?.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj avdelning" />
                </SelectTrigger>
                <SelectContent>
                  {departments.filter((dept: any) => dept.isActive).map((department: any) => (
                    <SelectItem key={department.id} value={department.id.toString()}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusId">Status</Label>
              <Select name="statusId" defaultValue={deviation?.statusId?.toString() || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj status" />
                </SelectTrigger>
                <SelectContent>
                  {deviationStatuses
                    ?.filter((status: DeviationStatus) => status.isActive)
                    ?.sort((a: DeviationStatus, b: DeviationStatus) => a.order - b.order)
                    ?.map((status: DeviationStatus) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: status.color || '#10b981' }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(deviationSettings?.usePriorities ?? true) && (
              <div>
                <Label htmlFor="priorityId">Prioritet</Label>
                <Select name="priorityId" defaultValue={deviation?.priorityId?.toString() || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj prioritet" />
                  </SelectTrigger>
                  <SelectContent>
                    {deviationPriorities
                      .filter(priority => priority.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((priority) => (
                      <SelectItem key={priority.id} value={priority.id.toString()}>
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
                <Select name="workTaskId" defaultValue={deviation?.workTaskId?.toString() || "0"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj arbetsmoment" />
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

            {mode === 'edit' && (
              <div>
                <Label htmlFor="assignedToUserId">Tilldela till</Label>
                <Select name="assignedToUserId" defaultValue={deviation?.assignedToUserId?.toString() || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj användare" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ingen vald</SelectItem>
                    {users.filter(user => user.isActive).map((user) => (
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
                <Select name="locationId" defaultValue={deviation?.locationId?.toString() || "0"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj plats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Ingen vald</SelectItem>
                    {workStations.map((station) => (
                      <SelectItem key={station.id} value={station.id.toString()}>
                        {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}


            {mode === 'edit' && (
            <div>
              <Label htmlFor="dueDate">Deadline</Label>
              <DatePicker
                value={selectedDueDate !== "" ? selectedDueDate : (deviation?.dueDate ? new Date(deviation.dueDate).toISOString().split('T')[0] : "")}
                onChange={(value) => {
                  setSelectedDueDate(value);
                }}
                placeholder="Välj deadline"
              />
              <input type="hidden" name="dueDate" value={selectedDueDate !== "" ? selectedDueDate : (deviation?.dueDate ? new Date(deviation.dueDate).toISOString().split('T')[0] : "")} />
            </div>
      )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createDeviationMutation.isPending || updateDeviationMutation.isPending}>
              {(createDeviationMutation.isPending || updateDeviationMutation.isPending) 
            ? (mode === 'edit' ? "Uppdaterar..." : "Skapar...") 
            : (mode === 'edit' ? "Uppdatera avvikelse" : "Skapa avvikelse")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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

interface DeviationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeviationModal({ isOpen, onClose, onSuccess }: DeviationModalProps) {
  const { toast } = useToast();

  // Fetch deviation types
  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
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

  const handleCreateDeviation = (formData: FormData) => {
    const data = {
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      deviationTypeId: parseInt(formData.get("deviationTypeId") as string),
      priority: formData.get("priority"),
      assignedToUserId: formData.get("assignedToUserId") ? parseInt(formData.get("assignedToUserId") as string) : undefined,
      workTaskId: formData.get("workTaskId") ? parseInt(formData.get("workTaskId") as string) : undefined,
      locationId: formData.get("locationId") ? parseInt(formData.get("locationId") as string) : undefined,
      dueDate: formData.get("dueDate") || undefined,
    };

    createDeviationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Skapa ny avvikelse</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          handleCreateDeviation(new FormData(e.currentTarget));
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Titel *</Label>
              <Input id="title" name="title" required />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
            
            <div>
              <Label htmlFor="deviationTypeId">Avvikelsetyp *</Label>
              <Select name="deviationTypeId" required>
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
              <Label htmlFor="priority">Prioritet</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Låg</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">Hög</SelectItem>
                  <SelectItem value="critical">Kritisk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="assignedToUserId">Tilldela till</Label>
              <Select name="assignedToUserId">
                <SelectTrigger>
                  <SelectValue placeholder="Välj användare" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(user => user.isActive).map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="workTaskId">Arbetsmoment</Label>
              <Select name="workTaskId">
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
              <Label htmlFor="locationId">Plats</Label>
              <Select name="locationId">
                <SelectTrigger>
                  <SelectValue placeholder="Välj plats" />
                </SelectTrigger>
                <SelectContent>
                  {workStations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dueDate">Deadline</Label>
              <Input 
                id="dueDate" 
                name="dueDate" 
                type="datetime-local"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button type="submit" disabled={createDeviationMutation.isPending}>
              {createDeviationMutation.isPending ? "Skapar..." : "Skapa avvikelse"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface SystemAnnouncement {
  id: number;
  tenantId: number;
  message: string;
  isActive: boolean;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

interface SystemAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: SystemAnnouncement;
  mode: "create" | "edit";
}

export function SystemAnnouncementModal({
  isOpen,
  onClose,
  announcement,
  mode,
}: SystemAnnouncementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState(announcement?.message || "");
  const [isActive, setIsActive] = useState(announcement?.isActive ?? true);

  const createAnnouncementMutation = useMutation({
    mutationFn: (data: { message: string; isActive: boolean }) =>
      apiRequest("/api/system/announcements", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcement"] });
      toast({
        title: "Systemmeddelande skapat",
        description: "Meddelandet har skapats framgångsrikt.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa systemmeddelande.",
        variant: "destructive",
      });
    },
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: (data: { message: string; isActive: boolean }) =>
      apiRequest(`/api/system/announcements/${announcement!.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcement"] });
      toast({
        title: "Systemmeddelande uppdaterat",
        description: "Meddelandet har uppdaterats framgångsrikt.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera systemmeddelande.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setMessage("");
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Fel",
        description: "Meddelande är obligatoriskt.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      message: message.trim(),
      isActive,
    };

    if (mode === "edit") {
      updateAnnouncementMutation.mutate(data);
    } else {
      createAnnouncementMutation.mutate(data);
    }
  };

  const isSubmitting = createAnnouncementMutation.isPending || updateAnnouncementMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={!isSubmitting ? onClose : undefined}>
      <DialogContent className="max-w-2xl">
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
            <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-3 shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                {mode === "edit" ? "Uppdaterar meddelande..." : "Skapar meddelande..."}
              </p>
            </div>
          </div>
        )}
        
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Redigera systemmeddelande" : "Skapa nytt systemmeddelande"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="message">Meddelande</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="⚙️ Planerat systemunderhåll 11 juli kl. 21:00–23:30. Under tiden kan störningar förekomma."
              rows={4}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Detta meddelande visas som en toast för alla användare när de loggar in.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSubmitting}
            />
            <Label htmlFor="isActive">Aktivt meddelande</Label>
            <p className="text-xs text-muted-foreground">
              Endast ett meddelande kan vara aktivt åt gången.
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting
                ? mode === "edit"
                  ? "Uppdaterar..."
                  : "Skapar..."
                : mode === "edit"
                  ? "Uppdatera meddelande"
                  : "Skapa meddelande"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
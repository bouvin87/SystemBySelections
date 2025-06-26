import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { SystemAnnouncement } from "@shared/schema";

export interface SystemAnnouncementModalProps {
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
  
  const [formData, setFormData] = useState({
    message: "",
    isActive: true,
  });

  useEffect(() => {
    if (announcement && mode === "edit") {
      setFormData({
        message: announcement.message,
        isActive: announcement.isActive,
      });
    } else {
      setFormData({
        message: "",
        isActive: true,
      });
    }
  }, [announcement, mode, isOpen]);

  const createMutation = useMutation({
    mutationFn: (data: { message: string; isActive: boolean }) =>
      apiRequest({ endpoint: "/api/system/announcements", method: "POST", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcements"] });
      toast({
        title: "Meddelande skapat",
        description: "Systemmeddelandet har skapats framgångsrikt.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa meddelandet.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { message: string; isActive: boolean }) =>
      apiRequest({ endpoint: `/api/system/announcements/${announcement?.id}`, method: "PATCH", data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/announcements"] });
      toast({
        title: "Meddelande uppdaterat",
        description: "Systemmeddelandet har uppdaterats framgångsrikt.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera meddelandet.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!formData.message.trim()) {
      toast({
        title: "Fel",
        description: "Meddelandet får inte vara tomt.",
        variant: "destructive",
      });
      return;
    }

    if (mode === "create") {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Skapa systemmeddelande" : "Redigera systemmeddelande"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Skapa ett nytt systemmeddelande som visas för alla användare."
              : "Redigera systemmeddelandet."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="message">Meddelande</Label>
            <Textarea
              id="message"
              placeholder="Skriv ditt systemmeddelande här..."
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={4}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <Label htmlFor="isActive">Aktivt meddelande</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Avbryt
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading
              ? mode === "create"
                ? "Skapar..."
                : "Uppdaterar..."
              : mode === "create"
              ? "Skapa meddelande"
              : "Uppdatera meddelande"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
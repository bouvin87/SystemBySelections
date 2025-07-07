// components/RoleDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Role } from "@shared/schema";

interface RoleDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: Role | null;
  handleSubmit: (data: any) => void;
}

export default function RoleDialog({
  open,
  onClose,
  editingItem,
  handleSubmit,
}: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Redigera roll" : "Lägg till roll"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get("name") as string,
              description: formData.get("description") as string,
            };
            handleSubmit(data);
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingItem?.description || ""}
                placeholder="Valfri beskrivning av rollen"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Spara
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

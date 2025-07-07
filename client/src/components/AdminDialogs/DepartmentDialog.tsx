// components/DepartmentDialog.tsx
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Department, User } from "@shared/schema";

interface DepartmentDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: Department | null;
  users: User[];
  handleSubmit: (data: any) => void;
}

export default function DepartmentDialog({
  open,
  onClose,
  editingItem,
  users,
  handleSubmit,
}: DepartmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Redigera avdelning" : "Lägg till avdelning"}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const responsibleUserIdValue = formData.get("responsibleUserId") as string;

            const data = {
              name: formData.get("name") as string,
              description: (formData.get("description") as string) || undefined,
              color: (formData.get("color") as string) || "#3b82f6",
              isActive: formData.get("isActive") === "on",
              order: parseInt(formData.get("order") as string) || 0,
              responsibleUserId:
                responsibleUserIdValue && responsibleUserIdValue !== "0"
                  ? parseInt(responsibleUserIdValue)
                  : undefined,
            };

            handleSubmit(data);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">Namn</Label>
            <Input id="name" name="name" defaultValue={editingItem?.name || ""} required />
          </div>
          <div>
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={editingItem?.description || ""}
            />
          </div>
          <div>
            <Label htmlFor="color">Färg</Label>
            <Input
              id="color"
              name="color"
              type="color"
              defaultValue={editingItem?.color || "#3b82f6"}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={editingItem?.isActive ?? true}
            />
            <Label htmlFor="isActive">Aktiv</Label>
          </div>
          <div>
            <Label htmlFor="order">Ordning</Label>
            <Input
              id="order"
              name="order"
              type="number"
              defaultValue={editingItem?.order || 0}
            />
          </div>
          <div>
            <Label htmlFor="responsibleUserId">Ansvarig användare</Label>
            <Select
              name="responsibleUserId"
              defaultValue={editingItem?.responsibleUserId?.toString() || "0"}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ingen vald" />
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
          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Spara
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// components/ShiftDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Shift } from "@shared/schema";

interface ShiftDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: Shift | null;
  handleSubmit: (data: {
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }) => void;
}

export default function ShiftDialog({
  open,
  onClose,
  editingItem,
  handleSubmit,
}: ShiftDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? `${t("admin.edit")} ${t("admin.shift").toLowerCase()}`
              : `${t("admin.add")} ${t("admin.shift").toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get("name") as string,
              startTime: formData.get("startTime") as string,
              endTime: formData.get("endTime") as string,
              isActive: formData.get("isActive") === "on",
            };
            handleSubmit(data);
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="name">{t("admin.name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={editingItem?.name || ""}
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">{t("admin.startTime")}</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={editingItem?.startTime || ""}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">{t("admin.endTime")}</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={editingItem?.endTime || ""}
                required
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={editingItem?.isActive ?? true}
            />
            <Label htmlFor="isActive">{t("admin.active")}</Label>
          </div>
          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {t("admin.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

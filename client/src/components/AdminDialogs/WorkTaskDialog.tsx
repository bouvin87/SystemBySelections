import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WorkTask } from "@shared/schema";

interface WorkTaskDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: WorkTask | null;
  handleSubmit: (data: { name: string; hasStations: boolean }) => void;
}

export default function WorkTaskDialog({
  open,
  onClose,
  editingItem,
  handleSubmit,
}: WorkTaskDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? `${t("admin.edit")} ${t("admin.workTask").toLowerCase()}`
              : `${t("admin.add")} ${t("admin.workTask").toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get("name") as string,
              hasStations: formData.get("hasStations") === "on",
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
          <div className="flex items-center space-x-2">
            <Switch
              id="hasStations"
              name="hasStations"
              defaultChecked={editingItem?.hasStations ?? false}
            />
            <Label htmlFor="hasStations">{t("admin.hasStations")}</Label>
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

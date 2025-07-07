// components/WorkStationDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WorkStation, WorkTask } from "@shared/schema";

interface WorkStationDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: WorkStation | null;
  workTasks: WorkTask[];
  handleSubmit: (data: { name: string; workTaskId: number }) => void;
}

export default function WorkStationDialog({
  open,
  onClose,
  editingItem,
  workTasks,
  handleSubmit,
}: WorkStationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? `${t("admin.edit")} ${t("admin.workStation").toLowerCase()}`
              : `${t("admin.add")} ${t("admin.workStation").toLowerCase()}`}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get("name") as string,
              workTaskId: parseInt(formData.get("workTaskId") as string),
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
          <div>
            <Label htmlFor="workTaskId">{t("admin.workTask")}</Label>
            <Select
              name="workTaskId"
              defaultValue={editingItem?.workTaskId?.toString() || ""}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Ingen vald" />
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

          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {t("admin.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

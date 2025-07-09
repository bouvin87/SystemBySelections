// components/ChecklistDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import IconPicker from "@/components/IconPicker"; // justera sökväg om nödvändigt
import type { Checklist, WorkTask } from "@shared/schema";

interface ChecklistDialogProps {
  open: boolean;
  onClose: () => void;
  editingItem: Checklist | null;
  selectedIcon: string;
  setSelectedIcon: (value: string) => void;
  selectedWorkTaskIds: number[];
  setSelectedWorkTaskIds: (ids: number[]) => void;
  workTasks: WorkTask[];
  handleSubmit: (formData: FormData) => void;

}

export default function ChecklistDialog({
  open,
  onClose,
  editingItem,
  selectedIcon,
  setSelectedIcon,
  selectedWorkTaskIds,
  setSelectedWorkTaskIds,
  workTasks,
  handleSubmit,

}: ChecklistDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? t("admin.edit") + " " + t("admin.checklists").toLowerCase()
              : t("admin.add") + " " + t("admin.checklists").toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleSubmit(formData);
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
            <Label htmlFor="description">{t("admin.description")}</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={editingItem?.description || ""}
            />
          </div>
          <IconPicker
            value={selectedIcon}
            onChange={setSelectedIcon}
            placeholder={t("admin.selectIcon")}
          />
          <input type="hidden" name="icon" value={selectedIcon} />
          <div>
            <Label htmlFor="order">{t("admin.order")}</Label>
            <Input
              id="order"
              name="order"
              type="number"
              defaultValue={editingItem?.order || 0}
            />
          </div>

          {/* Arbetsmoment */}
          <div>
            <Label className="text-base font-medium">
              Välj arbetsmoment
            </Label>
            <div className="mt-2">
              <Select
                value=""
                onValueChange={(value) => {
                  const workTaskId = parseInt(value);
                  if (!selectedWorkTaskIds.includes(workTaskId)) {
                    setSelectedWorkTaskIds([
                      ...selectedWorkTaskIds,
                      workTaskId,
                    ]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj arbetsmoment att lägga till..." />
                </SelectTrigger>
                <SelectContent>
                  {workTasks
                    .filter((workTask) => !selectedWorkTaskIds.includes(workTask.id))
                    .map((workTask) => (
                      <SelectItem key={workTask.id} value={workTask.id.toString()}>
                        {workTask.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedWorkTaskIds.length > 0 && (
                <div className="mt-3 space-y-1">
                  <Label className="text-sm font-medium text-gray-700">
                    Valda arbetsmoment:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkTaskIds.map((workTaskId) => {
                      const task = workTasks.find((t) => t.id === workTaskId);
                      return task ? (
                        <Badge key={workTaskId} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                          {task.name}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedWorkTaskIds(
                                selectedWorkTaskIds.filter((id) => id !== workTaskId),
                              )
                            }
                            className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Switchar */}
          {[
            { id: "includeWorkStations", label: t("admin.includeWorkStations"), defaultChecked: editingItem?.includeWorkStations ?? true },
            { id: "includeShifts", label: t("admin.includeShifts"), defaultChecked: editingItem?.includeShifts ?? true },
            { id: "isActive", label: t("admin.active"), defaultChecked: editingItem?.isActive ?? true },
            { id: "showInMenu", label: t("admin.showInMenu"), defaultChecked: editingItem?.showInMenu ?? false },
            { id: "hasDashboard", label: t("admin.hasDashboard"), defaultChecked: editingItem?.hasDashboard ?? false },
          ].map(({ id, label, defaultChecked }) => (
            <div className="flex items-center space-x-2" key={id}>
              <Switch id={id} name={id} defaultChecked={defaultChecked} />
              <Label htmlFor={id}>{label}</Label>
            </div>
          ))}

          <Button type="submit" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            {t("admin.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}




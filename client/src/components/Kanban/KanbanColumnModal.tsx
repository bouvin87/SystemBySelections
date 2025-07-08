import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as Icons from "lucide-react";
import { KanbanColumn } from "@shared/schema";

interface KanbanColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: KanbanColumn | null;
  boardId?: string;
  onSubmit: (data: any) => void;
}

const COLUMN_ICONS = [
  "List", "Columns", "ListTodo", "CheckSquare", "Clock", "AlertCircle",
  "PlayCircle", "PauseCircle", "CheckCircle", "XCircle", "Loader", "Archive"
];

export function KanbanColumnModal({ 
  open, 
  onOpenChange, 
  column, 
  boardId,
  onSubmit 
}: KanbanColumnModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("List");
  const [position, setPosition] = useState(0);

  useEffect(() => {
    if (column) {
      setTitle(column.title);
      setDescription(column.description || "");
      setIcon(column.icon || "List");
      setPosition(column.position);
    } else {
      setTitle("");
      setDescription("");
      setIcon("List");
      setPosition(0);
    }
  }, [column, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      boardId,
      title,
      description,
      icon,
      position,
    });
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {column ? "Redigera Kolumn" : "Skapa Ny Kolumn"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kolumnens titel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskrivning av kolumnen"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Ikon</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getIcon(icon)}
                    <span>{icon}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {COLUMN_ICONS.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center gap-2">
                      {getIcon(iconName)}
                      <span>{iconName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              type="number"
              value={position}
              onChange={(e) => setPosition(parseInt(e.target.value) || 0)}
              placeholder="Position i tavlan"
              min="0"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {column ? "Uppdatera" : "Skapa"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
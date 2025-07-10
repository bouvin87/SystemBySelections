import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { KanbanBoard } from "@shared/schema";

interface KanbanBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  board?: KanbanBoard | null;
  onSubmit: (data: any) => void;
  onDelete?: () => void;
}

const BOARD_ICONS = [
  "ClipboardList", "Kanban", "Layout", "Grid3x3", "Columns", "Calendar", 
  "CheckSquare", "Target", "TrendingUp", "Briefcase", "Folder", "Star"
];

export function KanbanBoardModal({ 
  open, 
  onOpenChange, 
  board, 
  onSubmit, 
  onDelete 
}: KanbanBoardModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("ClipboardList");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDescription(board.description || "");
      setIcon(board.icon || "ClipboardList");
      setIsPublic(board.isPublic || false);
    } else {
      setName("");
      setDescription("");
      setIcon("ClipboardList");
      setIsPublic(false);
    }
  }, [board, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      icon,
      isPublic,
    });
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.ClipboardList;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {board ? "Redigera Tavla" : "Skapa Ny Tavla"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tavlans namn"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskrivning av tavlan"
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
                {BOARD_ICONS.map((iconName) => (
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

          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
            <Label htmlFor="isPublic">Gör tavlan offentlig</Label>
          </div>

          <div className="flex justify-between pt-4">
            <div>
              {board && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Ta bort
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
                <Button type="submit" disabled={name.trim().length === 0}>
                {board ? "Uppdatera" : "Skapa"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
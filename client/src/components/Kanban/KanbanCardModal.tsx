import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, X } from "lucide-react";
import * as Icons from "lucide-react";
import { KanbanCard } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
interface KanbanCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: KanbanCard | null;
  columnId?: string | null;
  onSubmit: (data: any) => void;
  board: any;
}

const CARD_ICONS = [
  "FileText", "CheckSquare", "AlertCircle", "Star", "Flag", "Bookmark",
  "Tag", "Calendar", "Clock", "User", "Users", "MessageSquare", "Paperclip"
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Låg", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Hög", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" }
];

export function KanbanCardModal({ 
  open, 
  onOpenChange, 
  card, 
  columnId,
  onSubmit,
  board
}: KanbanCardModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("FileText");
  const [position, setPosition] = useState(0);
  const [priorityLevel, setPriorityLevel] = useState("medium");
  const [completed, setCompleted] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const { user } = useAuth();
  const isOwner = user?.id === board.ownerUserId || user?.role === "admin";
  
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || "");
      setIcon(card.icon || "FileText");
      setPosition(card.position);
      setPriorityLevel(card.priorityLevel || "medium");
      setCompleted(card.completed || false);
      setCommentsEnabled(card.commentsEnabled !== false);
      setLabels(card.labels || []);
      setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : "");
    } else {
      setTitle("");
      setDescription("");
      setIcon("FileText");
      setPosition(0);
      setPriorityLevel("medium");
      setCompleted(false);
      setCommentsEnabled(true);
      setLabels([]);
      setNewLabel("");
      setDueDate("");
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      columnId,
      title,
      description,
      icon,
      position,
      priorityLevel,
      completed,
      commentsEnabled,
      labels,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    });
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel("");
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter(label => label !== labelToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLabel();
    }
  };
  const handleDelete = async () => {
    if (!card) return;

    try {
      await apiRequest("DELETE", `/api/kanban/cards/${card.id}`);
      toast({
        title: "Kort raderat",
        description: "Kortet har raderats.",
      });
      onOpenChange(false);
      queryClient.invalidateQueries(); // Eller en mer specifik queryKey om du vill
    } catch (error: any) {
      toast({
        title: "Fel vid borttagning",
        description: error.message || "Kunde inte ta bort kortet.",
        variant: "destructive",
      });
    }
  };
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {card ? "Redigera Kort" : "Skapa Nytt Kort"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kortets titel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskrivning av kortet"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Ikon</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getIcon(icon)}
                      <span className="truncate">{icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CARD_ICONS.map((iconName) => (
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
                placeholder="Position"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priorityLevel">Prioritetsnivå</Label>
            <Select value={priorityLevel} onValueChange={setPriorityLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <span className={`px-2 py-1 rounded text-xs ${priority.color}`}>
                      {priority.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Förfallodatum</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Etiketter</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Lägg till etikett"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddLabel} variant="outline">
                Lägg till
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {labels.map((label) => (
                <Badge key={label} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X 
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveLabel(label)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="completed"
                checked={completed}
                onCheckedChange={setCompleted}
              />
              <Label htmlFor="completed">Markera som slutförd</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="commentsEnabled"
                checked={commentsEnabled}
                onCheckedChange={setCommentsEnabled}
              />
              <Label htmlFor="commentsEnabled">Aktivera kommentarer</Label>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            {/* Vänstersida: Soptunna */}
            <div>
              {isOwner && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Ta bort
                </Button>
              )}
            </div>

            {/* Högersida: Avbryt & Spara */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={!title.trim()}>
                {card ? "Uppdatera" : "Skapa"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
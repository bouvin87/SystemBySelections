import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  DragOverlay,
  closestCorners,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Settings, Trash2, GripVertical } from "lucide-react";
import * as Icons from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

interface KanbanCardComponentProps {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
}

function KanbanCardComponent({ card, onEdit }: KanbanCardComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-md transition-shadow bg-white touch-manipulation select-none"
      onClick={() => onEdit(card)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {getIcon(card.icon || "FileText")}
            <span className="text-sm font-medium">{card.title}</span>
          </div>
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded touch-manipulation"
            onClick={(e) => e.stopPropagation()}
            style={{ touchAction: 'none' }}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
        {card.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {card.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface KanbanColumnComponentProps {
  column: KanbanColumn;
  items: KanbanCard[];
  onCreateCard: (columnId: string) => void;
  onEditColumn: (column: KanbanColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditCard: (card: KanbanCard) => void;
  canDelete: boolean;
}

function KanbanColumnComponent({
  column,
  items,
  onCreateCard,
  onEditColumn,
  onDeleteColumn,
  onEditCard,
  canDelete,
}: KanbanColumnComponentProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card 
      ref={setNodeRef}
      className={`min-w-[300px] max-w-[300px] bg-surface border border-border rounded-2xl shadow-sm ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon(column.icon || "List")}
            <CardTitle className="text-base font-semibold">{column.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onCreateCard(column.id);
              }}
              className="h-8 w-8 p-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEditColumn(column);
              }}
              className="h-8 w-8 p-0"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDeleteColumn(column.id);
                }}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {column.description && (
          <p className="text-sm text-muted-foreground leading-snug">{column.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 min-h-[300px] p-4">
        <SortableContext 
          items={items.map(item => item.id)} 
          strategy={verticalListSortingStrategy}
        >
          {items.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onEdit={onEditCard}
            />
          ))}
        </SortableContext>
        <div className="mt-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCreateCard(column.id);
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till kort
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function KanbanDetails() {
  const [location, navigate] = useLocation();
  const boardId = location.split('/')[2];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  // Fetch board details
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}`],
    enabled: !!boardId,
  });

  // Fetch columns 
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/columns`],
    enabled: !!boardId,
  });

  // Fetch cards
  const { data: allCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/cards`],
    enabled: !!boardId,
  });

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const result: Record<string, KanbanCard[]> = {};
    columns.forEach((column: KanbanColumn) => {
      result[column.id] = allCards
        .filter((card: KanbanCard) => card.columnId === column.id)
        .sort((a: KanbanCard, b: KanbanCard) => a.position - b.position);
    });
    return result;
  }, [columns, allCards]);

  // Sort columns by position
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a: KanbanColumn, b: KanbanColumn) => a.position - b.position);
  }, [columns]);

  // Get all items (columns and cards) for DndContext
  const items = useMemo(() => {
    const columnIds = sortedColumns.map(col => col.id);
    const cardIds = allCards.map((card: KanbanCard) => card.id);
    return [...columnIds, ...cardIds];
  }, [sortedColumns, allCards]);

  // Find active card for drag overlay
  const activeCard = useMemo(() => {
    if (!activeId) return null;
    return allCards.find((card: KanbanCard) => card.id === activeId);
  }, [activeId, allCards]);

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumnId, newPosition }: { cardId: string, newColumnId: string, newPosition: number }) => {
      return apiRequest("POST", `/api/kanban/cards/${cardId}/move`, { columnId: newColumnId, position: newPosition });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
    },
  });

  // Sensors for drag and drop (mobile-friendly)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find what we're dragging
    const activeCard = allCards.find((card: KanbanCard) => card.id === activeId);
    if (!activeCard) return;

    // Find what we're over - could be a column or a card
    const overCard = allCards.find((card: KanbanCard) => card.id === overId);
    const overColumn = columns.find((col: KanbanColumn) => col.id === overId);

    // Determine the target column
    let targetColumnId: string;
    if (overCard) {
      targetColumnId = overCard.columnId;
    } else if (overColumn) {
      targetColumnId = overColumn.id;
    } else {
      return;
    }

    // If we're dropping in the same column, let handleDragEnd handle it
    if (activeCard.columnId === targetColumnId) return;

    // Moving to a different column - move to end of that column
    const targetCards = cardsByColumn[targetColumnId] || [];
    const newPosition = targetCards.length;

    moveCardMutation.mutate({
      cardId: activeCard.id,
      newColumnId: targetColumnId,
      newPosition,
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeCard = allCards.find((card: KanbanCard) => card.id === activeId);
    if (!activeCard) return;

    // Find what we're over
    const overCard = allCards.find((card: KanbanCard) => card.id === overId);
    const overColumn = columns.find((col: KanbanColumn) => col.id === overId);

    let targetColumnId: string;
    let newPosition: number;

    if (overCard && overCard.columnId === activeCard.columnId) {
      // Reordering within the same column
      targetColumnId = activeCard.columnId;
      const columnCards = cardsByColumn[targetColumnId] || [];
      const oldIndex = columnCards.findIndex(card => card.id === activeId);
      const newIndex = columnCards.findIndex(card => card.id === overId);
      
      if (oldIndex !== newIndex) {
        newPosition = newIndex;
        moveCardMutation.mutate({
          cardId: activeCard.id,
          newColumnId: targetColumnId,
          newPosition,
        });
      }
    } else if (overColumn) {
      // Dropping on a column
      targetColumnId = overColumn.id;
      const targetCards = cardsByColumn[targetColumnId] || [];
      newPosition = targetCards.length;

      if (targetColumnId !== activeCard.columnId) {
        moveCardMutation.mutate({
          cardId: activeCard.id,
          newColumnId: targetColumnId,
          newPosition,
        });
      }
    }
  };

  // Column management
  const handleCreateColumn = () => {
    setEditingColumn(null);
    setShowColumnModal(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setShowColumnModal(true);
  };

  const handleDeleteColumn = async (columnId: string) => {
    try {
      await apiRequest("DELETE", `/api/kanban/columns/${columnId}`);
      toast({ title: "Kolumn borttagen", description: "Kolumnen har tagits bort framgångsrikt." });
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
    } catch (error) {
      toast({ title: "Fel", description: "Kunde inte ta bort kolumnen.", variant: "destructive" });
    }
  };

  // Card management
  const handleCreateCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingCard(null);
    setShowCardModal(true);
  };

  const handleEditCard = (card: KanbanCard) => {
    setSelectedColumnId(card.columnId);
    setEditingCard(card);
    setShowCardModal(true);
  };

  if (boardLoading || columnsLoading || cardsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laddar...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Tavla hittades inte</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" style={{ touchAction: 'pan-y' }}>
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/kanban")}
              className="flex items-center gap-2"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <ArrowLeft className="h-4 w-4" />
              Tillbaka
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="text-gray-600 mt-1">{board.description}</p>
              )}
            </div>
          </div>
          <Button
            onClick={handleCreateColumn}
            className="flex items-center gap-2"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Plus className="h-4 w-4" />
            Ny kolumn
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={true}
        >
          <div className="flex gap-6 overflow-x-auto pb-6 min-h-0" style={{ touchAction: 'auto' }}>
            {sortedColumns.map((column: KanbanColumn) => (
              <KanbanColumnComponent
                key={column.id}
                column={column}
                items={cardsByColumn[column.id] || []}
                onCreateCard={handleCreateCard}
                onEditColumn={handleEditColumn}
                onDeleteColumn={handleDeleteColumn}
                onEditCard={handleEditCard}
                canDelete={columns.length > 1}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <KanbanCardComponent
                card={activeCard}
                onEdit={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Modals */}
      <KanbanColumnModal
        open={showColumnModal}
        onOpenChange={setShowColumnModal}
        boardId={boardId}
        column={editingColumn}
        onSubmit={async (data) => {
          try {
            if (editingColumn) {
              await apiRequest("PATCH", `/api/kanban/columns/${editingColumn.id}`, data);
            } else {
              await apiRequest("POST", `/api/kanban/columns`, { ...data, boardId });
            }
            setShowColumnModal(false);
            setEditingColumn(null);
            queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
            toast({ title: "Kolumn sparad", description: "Kolumnen har sparats framgångsrikt." });
          } catch (error: any) {
            toast({ title: "Fel", description: error.message || "Kunde inte spara kolumnen.", variant: "destructive" });
          }
        }}
      />

      <KanbanCardModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        columnId={selectedColumnId || ""}
        card={editingCard}
        onSubmit={async (data) => {
          try {
            if (editingCard) {
              await apiRequest("PATCH", `/api/kanban/cards/${editingCard.id}`, data);
            } else {
              await apiRequest("POST", `/api/kanban/cards`, { ...data, columnId: selectedColumnId });
            }
            setShowCardModal(false);
            setEditingCard(null);
            setSelectedColumnId(null);
            queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
            toast({ title: "Kort sparat", description: "Kortet har sparats framgångsrikt." });
          } catch (error: any) {
            toast({ title: "Fel", description: error.message || "Kunde inte spara kortet.", variant: "destructive" });
          }
        }}
      />
    </div>
  );
}
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, KeyboardSensor, useSensor, useSensors, UniqueIdentifier, DragOverlay } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from "@dnd-kit/sortable";
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
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-4 w-4" />;
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 bg-white border border-gray-200 rounded-lg p-3"
      >
        <div className="h-16"></div>
      </div>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-md transition-shadow bg-white"
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
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-gray-400" />
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
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-[300px] h-[200px] opacity-40"
      ></div>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="min-w-[300px] max-w-[300px] bg-muted/30"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon(column.icon || "List")}
            <CardTitle className="text-lg">{column.title}</CardTitle>
            <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateCard(column.id)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEditColumn(column)}
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteColumn(column.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {column.description && (
          <p className="text-sm text-muted-foreground">{column.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2 min-h-[100px]">
        <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
          {items.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onEdit={onEditCard}
            />
          ))}
        </SortableContext>
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutations
  const createColumnMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/kanban/boards/${boardId}/columns`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
      setShowColumnModal(false);
      setEditingColumn(null);
      toast({ description: "Kolumn skapad" });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/kanban/columns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
      setShowColumnModal(false);
      setEditingColumn(null);
      toast({ description: "Kolumn uppdaterad" });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/kanban/columns/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
      toast({ description: "Kolumn borttagen" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/kanban/cards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
      setShowCardModal(false);
      setEditingCard(null);
      setSelectedColumnId(null);
      toast({ description: "Kort skapat" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/kanban/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
      setShowCardModal(false);
      setEditingCard(null);
      setSelectedColumnId(null);
      toast({ description: "Kort uppdaterat" });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: any }) =>
      apiRequest(`/api/kanban/cards/${cardId}/move`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
    },
  });

  // Event handlers
  const handleCreateColumn = () => {
    setEditingColumn(null);
    setShowColumnModal(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setShowColumnModal(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm("Är du säker på att du vill ta bort denna kolumn?")) {
      deleteColumnMutation.mutate(columnId);
    }
  };

  const handleCreateCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingCard(null);
    setShowCardModal(true);
  };

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setSelectedColumnId(card.columnId);
    setShowCardModal(true);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = allCards.find((card: KanbanCard) => card.id === activeId);
    const isOverACard = allCards.find((card: KanbanCard) => card.id === overId);
    const isOverAColumn = columns.find((col: KanbanColumn) => col.id === overId);

    if (!isActiveACard) return;

    // Card over card
    if (isActiveACard && isOverACard) {
      const activeCard = isActiveACard as KanbanCard;
      const overCard = isOverACard as KanbanCard;

      if (activeCard.columnId !== overCard.columnId) {
        // Moving to different column
        moveCardMutation.mutate({
          cardId: activeCard.id,
          data: {
            columnId: overCard.columnId,
            position: overCard.position,
          },
        });
      }
    }

    // Card over column
    if (isActiveACard && isOverAColumn) {
      const activeCard = isActiveACard as KanbanCard;
      const overColumn = isOverAColumn as KanbanColumn;

      if (activeCard.columnId !== overColumn.id) {
        const columnCards = cardsByColumn[overColumn.id] || [];
        moveCardMutation.mutate({
          cardId: activeCard.id,
          data: {
            columnId: overColumn.id,
            position: columnCards.length,
          },
        });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeCard = allCards.find((card: KanbanCard) => card.id === active.id);
    const overCard = allCards.find((card: KanbanCard) => card.id === over.id);
    const overColumn = columns.find((col: KanbanColumn) => col.id === over.id);

    if (!activeCard) return;

    if (overCard && activeCard.columnId === overCard.columnId) {
      // Reordering within same column
      const columnCards = cardsByColumn[activeCard.columnId] || [];
      const oldIndex = columnCards.findIndex((card: KanbanCard) => card.id === active.id);
      const newIndex = columnCards.findIndex((card: KanbanCard) => card.id === over.id);
      
      if (oldIndex !== newIndex) {
        moveCardMutation.mutate({
          cardId: activeCard.id,
          data: {
            columnId: activeCard.columnId,
            position: newIndex,
          },
        });
      }
    }
  };

  if (!boardId) {
    navigate("/kanban");
    return null;
  }

  if (boardLoading || columnsLoading || cardsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center">Laddar...</div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </div>
        <div className="text-center">Tavla inte hittad</div>
      </div>
    );
  }

  const activeCard = activeId ? allCards.find((card: KanbanCard) => card.id === activeId) : null;
  const sortedColumns = columns.sort((a: KanbanColumn, b: KanbanColumn) => a.position - b.position);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/kanban")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            {board.description && (
              <p className="text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateColumn}>
            <Plus className="h-4 w-4 mr-2" />
            Ny kolumn
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-6">
          <SortableContext
            items={sortedColumns.map((col: KanbanColumn) => col.id)}
            strategy={rectSortingStrategy}
          >
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
          </SortableContext>
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

      {/* Modals */}
      <KanbanColumnModal
        open={showColumnModal}
        onOpenChange={(open) => {
          setShowColumnModal(open);
          if (!open) setEditingColumn(null);
        }}
        column={editingColumn}
        boardId={boardId}
        onSubmit={(data) => {
          if (editingColumn) {
            updateColumnMutation.mutate({ id: editingColumn.id, data });
          } else {
            createColumnMutation.mutate({ ...data, boardId });
          }
        }}
      />

      <KanbanCardModal
        open={showCardModal}
        onOpenChange={(open) => {
          setShowCardModal(open);
          if (!open) {
            setEditingCard(null);
            setSelectedColumnId(null);
          }
        }}
        card={editingCard}
        columnId={selectedColumnId || ""}
        onSubmit={(data) => {
          if (editingCard) {
            updateCardMutation.mutate({ id: editingCard.id, data });
          } else {
            createCardMutation.mutate({ ...data, columnId: selectedColumnId });
          }
        }}
      />
    </div>
  );
}
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Trash2, GripVertical, ArrowLeft } from "lucide-react";
import * as Icons from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanBoardModal } from "@/components/Kanban/KanbanBoardModal";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";

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
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-3 w-3" />;
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 mb-2"
      ref={setNodeRef}
      style={style}
      onClick={(e) => {
        // Only prevent default if not dragging
        if (!isDragging) {
          e.preventDefault();
          e.stopPropagation();
          onEdit(card);
        }
      }}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div 
            {...listeners} 
            {...attributes}
            className="cursor-grab hover:cursor-grabbing p-1"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            {getIcon(card.icon || "FileText")}
            <span className="font-medium text-sm">{card.title}</span>
          </div>
          {card.priorityLevel && (
            <Badge
              variant={
                card.priorityLevel === "high"
                  ? "destructive"
                  : card.priorityLevel === "medium"
                  ? "default"
                  : "secondary"
              }
              className="text-xs"
            >
              {card.priorityLevel === "high"
                ? "Hög"
                : card.priorityLevel === "medium"
                ? "Medium"
                : "Låg"}
            </Badge>
          )}
        </div>
        {card.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
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
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card className="min-w-[300px] max-w-[300px] bg-muted/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon(column.icon || "List")}
            <CardTitle className="text-base">{column.title}</CardTitle>
            <Badge variant="secondary">{items.length}</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCreateCard(column.id);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditColumn(column);
              }}
            >
              <Settings className="h-3 w-3" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteColumn(column.id);
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        {column.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {column.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="min-h-[200px]">
        <div className="mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCreateCard(column.id);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Lägg till kort
          </Button>
        </div>
        
        <SortableContext items={items.map(item => item.id)} strategy={rectSortingStrategy}>
          <div className="space-y-2">
            {items.map((card) => (
              <KanbanCardComponent
                key={card.id}
                card={card}
                onEdit={onEditCard}
              />
            ))}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default function KanbanDetails() {
  const [location, navigate] = useLocation();
  const boardId = location.split('/')[2]; // Extract boardId from /kanban/[boardId]
  
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch board details
  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["/api/kanban/boards", boardId],
    enabled: !!boardId,
    onSuccess: (data) => {
      console.log("Kanban Details - Fetched board:", data);
    },
  });

  // Fetch columns for this board
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/kanban/boards", boardId, "columns"],
    enabled: !!boardId,
    onSuccess: (data) => {
      console.log("Kanban Details - Fetched columns:", data);
      console.log("Number of columns:", data.length);
      console.log("Column details:", data.map(c => ({id: c.id, title: c.title, position: c.position})));
    },
  });

  // Fetch cards for this board
  const { data: allCards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["/api/kanban/boards", boardId, "cards"],
    enabled: !!boardId && columns.length > 0,
    onSuccess: (data) => {
      console.log("Kanban Details - Fetched all cards:", data);
    },
  });

  // Group cards by column
  const cardsByColumn = useMemo(() => {
    const result: Record<string, KanbanCard[]> = {};
    if (columns && Array.isArray(columns)) {
      columns.forEach((column: KanbanColumn) => {
        result[column.id] = allCards.filter((card: KanbanCard) => card.columnId === column.id);
      });
    }
    return result;
  }, [columns, allCards]);

  // Mutations
  const createColumnMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/kanban/columns`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "columns"] });
      setShowColumnModal(false);
      setEditingColumn(null);
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/kanban/columns/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "columns"] });
      setShowColumnModal(false);
      setEditingColumn(null);
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) =>
      apiRequest(`/api/kanban/columns/${columnId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "columns"] });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/kanban/cards`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "cards"] });
      setShowCardModal(false);
      setEditingCard(null);
      setSelectedColumnId(null);
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/kanban/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "cards"] });
      setShowCardModal(false);
      setEditingCard(null);
      setSelectedColumnId(null);
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: any }) =>
      apiRequest(`/api/kanban/cards/${cardId}/move`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", boardId, "cards"] });
    },
  });

  // Event handlers
  const handleCreateColumn = () => {
    setEditingColumn(null);
    setShowColumnModal(true);
  };

  const handleCreateCard = (columnId: string) => {
    setSelectedColumnId(columnId);
    setEditingCard(null);
    setShowCardModal(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setShowColumnModal(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (confirm("Är du säker på att du vill ta bort denna kolumn? Alla kort i kolumnen kommer också att tas bort.")) {
      deleteColumnMutation.mutate(columnId);
    }
  };

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setSelectedColumnId(card.columnId);
    setShowCardModal(true);
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    // Check if we're hovering over a column or a card
    const activeCard = allCards.find((card: KanbanCard) => card.id === activeId);
    if (!activeCard) return;

    const overCard = allCards.find((card: KanbanCard) => card.id === overId);
    const overColumn = columns.find((col: KanbanColumn) => col.id === overId);

    if (overColumn) {
      // Dropping on a column
      if (activeCard.columnId !== overColumn.id) {
        moveCardMutation.mutate({
          cardId: activeCard.id,
          data: {
            columnId: overColumn.id,
            position: 0,
          },
        });
      }
    } else if (overCard && activeCard.columnId !== overCard.columnId) {
      // Dropping on a card in different column
      moveCardMutation.mutate({
        cardId: activeCard.id,
        data: {
          columnId: overCard.columnId,
          position: overCard.position,
        },
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCard = allCards.find((card: KanbanCard) => card.id === activeId);
    const overCard = allCards.find((card: KanbanCard) => card.id === overId);

    if (!activeCard) return;

    if (overCard && activeCard.columnId === overCard.columnId) {
      // Reordering within the same column
      const columnCards = cardsByColumn[activeCard.columnId] || [];
      const oldIndex = columnCards.findIndex((card: KanbanCard) => card.id === activeId);
      const newIndex = columnCards.findIndex((card: KanbanCard) => card.id === overId);

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

  if (boardLoading || columnsLoading || !columns) {
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
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          <SortableContext
            items={columns.map((col: KanbanColumn) => col.id)}
            strategy={rectSortingStrategy}
          >
            {columns.map((column: KanbanColumn) => (
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
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
  useSensor, 
  useSensors, 
  UniqueIdentifier, 
  DragOverlay, 
  closestCenter 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  rectSortingStrategy 
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as Icons from "lucide-react";
import type { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";

// Card Component
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

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 opacity-40"
      ></div>
    );
  }

  const priorityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800", 
    high: "bg-red-100 text-red-800"
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 bg-white border border-gray-200 rounded-lg mb-3"
      onClick={() => onEdit(card)}
    >
      <CardContent className="p-3">
        <h4 className="font-medium text-sm mb-2 text-gray-900">{card.title}</h4>
        {card.description && (
          <p className="text-xs text-gray-600 mb-3 line-clamp-2">
            {card.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {card.priority && (
            <Badge className={`text-xs ${priorityColors[card.priority as keyof typeof priorityColors]}`}>
              {card.priority}
            </Badge>
          )}
          {card.dueDate && (
            <span className="text-xs text-gray-500">
              {new Date(card.dueDate).toLocaleDateString('sv-SE')}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Column Component
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
  canDelete
}: KanbanColumnComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

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
      className="w-80 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
      {...attributes}
      {...listeners}
    >
      <CardHeader className="pb-3 bg-white border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon(column.icon || "List")}
            <CardTitle className="text-lg font-semibold text-gray-900">{column.title}</CardTitle>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
              {items.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onCreateCard(column.id);
              }}
            >
              <Icons.Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                onEditColumn(column);
              }}
            >
              <Icons.Edit className="h-4 w-4" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteColumn(column.id);
                }}
              >
                <Icons.Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {column.description && (
          <p className="text-sm text-gray-600 mt-2">{column.description}</p>
        )}
      </CardHeader>
      <CardContent className="p-4 min-h-[400px] bg-gray-50">
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
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Icons.Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Inga kort ännu</p>
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

// Main Component
export default function KanbanDetails() {
  const [location] = useLocation();
  const boardId = location.split("/")[2];
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [creatingCardForColumn, setCreatingCardForColumn] = useState<string | null>(null);

  // Queries
  const { data: board } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}`],
    enabled: !!boardId,
  });

  const { data: columns = [] } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/columns`],
    enabled: !!boardId,
  });

  const { data: allCards = [] } = useQuery({
    queryKey: [`/api/kanban/boards/${boardId}/cards`],
    enabled: !!boardId,
  });

  // Mutations
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, columnId, position }: { cardId: string; columnId: string; position: number }) => {
      return apiRequest("POST", `/api/kanban/cards/${cardId}/move`, { columnId, position });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) => apiRequest("DELETE", `/api/kanban/columns/${columnId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/columns`] });
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/boards/${boardId}/cards`] });
      toast({ title: "Kolumn borttagen" });
    },
  });

  // Data processing
  const cardsByColumn = useMemo(() => {
    const result: Record<string, KanbanCard[]> = {};
    columns.forEach((column: KanbanColumn) => {
      result[column.id] = allCards
        .filter((card: KanbanCard) => card.columnId === column.id)
        .sort((a: KanbanCard, b: KanbanCard) => a.position - b.position);
    });
    return result;
  }, [columns, allCards]);

  // Sensors - Optimal configuration for instant drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Event handlers
  const handleCreateColumn = () => {
    setEditingColumn(null);
    setIsColumnModalOpen(true);
  };

  const handleEditColumn = (column: KanbanColumn) => {
    setEditingColumn(column);
    setIsColumnModalOpen(true);
  };

  const handleCreateCard = (columnId: string) => {
    setCreatingCardForColumn(columnId);
    setEditingCard(null);
    setIsCardModalOpen(true);
  };

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card);
    setCreatingCardForColumn(null);
    setIsCardModalOpen(true);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (window.confirm("Är du säker på att du vill ta bort denna kolumn?")) {
      deleteColumnMutation.mutate(columnId);
    }
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
      const activeColumn = isActiveACard.columnId;
      const overColumn = isOverACard.columnId;

      if (activeColumn !== overColumn) {
        const overCards = cardsByColumn[overColumn] || [];
        const overIndex = overCards.findIndex((card: KanbanCard) => card.id === overId);
        
        moveCardMutation.mutate({
          cardId: activeId as string,
          columnId: overColumn,
          position: overIndex,
        });
      }
    }

    // Card over column
    if (isActiveACard && isOverAColumn) {
      const newColumnCards = cardsByColumn[overId] || [];
      
      moveCardMutation.mutate({
        cardId: activeId as string,
        columnId: overId as string,
        position: newColumnCards.length,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeCard = allCards.find((card: KanbanCard) => card.id === active.id);
    const overCard = allCards.find((card: KanbanCard) => card.id === over.id);
    const overColumn = columns.find((col: KanbanColumn) => col.id === over.id);

    if (activeCard && overCard && activeCard.columnId === overCard.columnId) {
      const columnCards = cardsByColumn[activeCard.columnId] || [];
      const oldIndex = columnCards.findIndex((card: KanbanCard) => card.id === active.id);
      const newIndex = columnCards.findIndex((card: KanbanCard) => card.id === over.id);

      if (oldIndex !== newIndex) {
        moveCardMutation.mutate({
          cardId: activeId as string,
          columnId: activeCard.columnId,
          position: newIndex,
        });
      }
    }
  };

  // Active card for overlay
  const activeCard = activeId ? allCards.find((card: KanbanCard) => card.id === activeId) : null;
  const sortedColumns = columns.sort((a: KanbanColumn, b: KanbanColumn) => a.position - b.position);

  if (!board) {
    return <div className="p-6">Laddar...</div>;
  }

  return (
    <div className="h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            {board.description && (
              <p className="text-gray-600 mt-1">{board.description}</p>
            )}
          </div>
          <Button 
            onClick={handleCreateColumn}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icons.Plus className="h-4 w-4 mr-2" />
            Ny kolumn
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
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
              <div className="rotate-3 scale-105 shadow-xl">
                <KanbanCardComponent
                  card={activeCard}
                  onEdit={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <KanbanColumnModal
        open={isColumnModalOpen}
        onOpenChange={setIsColumnModalOpen}
        boardId={boardId}
        column={editingColumn}
        onSuccess={() => {
          setIsColumnModalOpen(false);
          setEditingColumn(null);
        }}
      />

      <KanbanCardModal
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        boardId={boardId}
        columnId={creatingCardForColumn}
        card={editingCard}
        onSuccess={() => {
          setIsCardModalOpen(false);
          setEditingCard(null);
          setCreatingCardForColumn(null);
        }}
      />
    </div>
  );
}
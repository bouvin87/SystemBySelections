import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Settings, Link, ArrowLeft, GripVertical, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanBoardModal } from "@/components/Kanban/KanbanBoardModal";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Card Component
function SortableCard({ card, onEdit }: { card: KanbanCard, onEdit: (card: KanbanCard) => void }) {
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
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 cursor-pointer hover:shadow-sm"
      onClick={() => onEdit(card)}
      {...attributes}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getIcon(card.icon || "FileText")}
          <span className="font-medium text-sm">
            {card.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            {...listeners}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <GripVertical className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(card);
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {card.description && (
        <p className="text-xs text-muted-foreground mt-2">
          {card.description}
        </p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {card.labels?.map((label) => (
          <Badge
            key={label}
            variant="outline"
            className="text-xs"
          >
            {label}
          </Badge>
        ))}
        {card.priorityLevel &&
          card.priorityLevel !== "medium" && (
            <Badge
              variant={
                card.priorityLevel === "high" ||
                card.priorityLevel === "urgent"
                  ? "destructive"
                  : "default"
              }
              className="text-xs"
            >
              {card.priorityLevel}
            </Badge>
          )}
      </div>
    </Card>
  );
}

// Droppable Column Component
function DroppableColumn({ 
  column, 
  children, 
  onEdit,
  onDelete,
  cardCount,
  canDelete 
}: { 
  column: KanbanColumn, 
  children: React.ReactNode,
  onEdit: (column: KanbanColumn) => void,
  onDelete: (columnId: string) => void,
  cardCount: number,
  canDelete: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full" ref={setNodeRef}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon(column.icon || "List")}
              <CardTitle className="text-base">
                {column.title}
              </CardTitle>
              <Badge variant="secondary">
                {cardCount}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {/* handleCreateCard kommer att hanteras i parent */}}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(column)}
              >
                <Settings className="h-3 w-3" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(column.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {column.description && (
            <p className="text-sm text-muted-foreground">
              {column.description}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export default function KanbanPage() {
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  // Fetch all boards
  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ["/api/kanban/boards"],
  });

  // Fetch columns for selected board
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"],
    queryFn: async () => {
      console.log("Frontend: Fetching columns for board", selectedBoard?.id);
      const response = await apiRequest("GET", `/api/kanban/boards/${selectedBoard?.id}/columns`);
      const data = await response.json();
      console.log("Frontend: Parsed JSON data:", data);
      return data;
    },
    enabled: !!selectedBoard?.id,
    staleTime: 0,  // Force fresh data
    cacheTime: 0,  // Don't cache
  });

  // Debug logging
  console.log("Frontend: columns data:", columns);
  console.log("Frontend: columns loading:", columnsLoading);
  console.log("Frontend: selected board:", selectedBoard);

  // Fetch cards for all columns
  const { data: allCards = [] } = useQuery({
    queryKey: ["/api/kanban/cards", selectedBoard?.id],
    queryFn: async () => {
      if (!columns.length) return [];
      console.log("Frontend: Fetching cards for columns:", columns);
      const cardPromises = columns.map(async (column: KanbanColumn) => {
        const response = await apiRequest("GET", `/api/kanban/columns/${column.id}/cards`);
        const cards = await response.json();
        console.log(`Frontend: Cards for column ${column.title}:`, cards);
        return cards;
      });
      const cardArrays = await Promise.all(cardPromises);
      const flatCards = cardArrays.flat();
      console.log("Frontend: All cards flattened:", flatCards);
      return flatCards;
    },
    enabled: !!selectedBoard?.id && columns.length > 0,
    staleTime: 0,  // Force fresh data
    cacheTime: 0,  // Don't cache
  });

  // Mutations
  const createBoardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kanban/boards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setShowBoardModal(false);
      toast({ title: "Tavla skapad framgångsrikt" });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/kanban/boards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setShowBoardModal(false);
      setEditingBoard(null);
      toast({ title: "Tavla uppdaterad framgångsrikt" });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/kanban/boards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setSelectedBoard(null);
      toast({ title: "Tavla borttagen framgångsrikt" });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kanban/columns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"],
      });
      setShowColumnModal(false);
      setEditingColumn(null);
      toast({ title: "Kolumn skapad framgångsrikt" });
    },
  });

  const updateColumnMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/kanban/columns/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"],
      });
      setShowColumnModal(false);
      setEditingColumn(null);
      toast({ title: "Kolumn uppdaterad framgångsrikt" });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/kanban/columns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/cards", selectedBoard?.id],
      });
      toast({ title: "Kolumn borttagen framgångsrikt" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kanban/cards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/cards", selectedBoard?.id],
      });
      setShowCardModal(false);
      toast({ title: "Kort skapat framgångsrikt" });
    },
  });

  // Move card mutation
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumnId, position }: { cardId: string, newColumnId: string, position: number }) => {
      return await apiRequest("POST", `/api/kanban/cards/${cardId}/move`, { 
        columnId: newColumnId, 
        position 
      });
    },
    onSuccess: () => {
      // Invalidate the main cards query to refresh all cards
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/cards", selectedBoard?.id],
      });
      toast({
        title: "Kort flyttat",
        description: "Kortet har flyttats till den nya kolumnen.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte flytta kortet.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getCardsForColumn = (columnId: string) => {
    return allCards
      .filter((card: KanbanCard) => card.columnId === columnId)
      .sort((a: KanbanCard, b: KanbanCard) => a.position - b.position);
  };

  const handleCreateBoard = () => {
    setEditingBoard(null);
    setShowBoardModal(true);
  };

  const handleEditBoard = (board: KanbanBoard) => {
    setEditingBoard(board);
    setShowBoardModal(true);
  };

  const handleCreateColumn = () => {
    if (!selectedBoard) return;
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
    const { active } = event;
    setActiveId(active.id as string);
    
    // Determine if we're dragging a card or column
    if (allCards.find(card => card.id === active.id)) {
      setActiveType("card");
    } else if (columns?.find(col => col.id === active.id)) {
      setActiveType("column");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    if (activeType === "card") {
      // Handle card movement
      const activeCard = allCards.find(card => card.id === active.id);
      if (!activeCard) return;

      const overId = over.id as string;
      let newColumnId = activeCard.columnId;
      
      // Check if dropped on a column or another card
      const overColumn = columns?.find(col => col.id === overId);
      if (overColumn) {
        newColumnId = overColumn.id;
      } else {
        const overCard = allCards.find(card => card.id === overId);
        if (overCard) {
          newColumnId = overCard.columnId;
        }
      }

      // If column changed, update the card
      if (newColumnId !== activeCard.columnId) {
        moveCardMutation.mutate({
          cardId: activeCard.id,
          newColumnId,
          position: 0 // For now, put at top of new column
        });
      }
    }
  };

  if (boardsLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20">
        <div className="text-center">Laddar tavlor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navigation />

      {/* Header */}
      {!selectedBoard ? (
        <div className="bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Tillbaka
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Kanban Tavlor
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Organisera ditt arbete med anpassningsbara Kanban-tavlor
                  </p>
                </div>
              </div>
              <Button
                onClick={handleCreateBoard}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ny Tavla
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              {/* Vänstersida: Tillbaka + titel + ikon */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBoard(null)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tillbaka till tavlor
                </Button>
                <div className="flex items-center gap-2">
                  <div className="text-muted-foreground">
                    {getIcon(selectedBoard.icon || "ClipboardList")}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">
                      {selectedBoard.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Hantera kolumner och kort
                    </p>
                  </div>
                </div>
              </div>

              {/* Högersida: Åtgärdsknappar */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCreateColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny Kolumn
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEditBoard(selectedBoard)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Board Selection */}
      {!selectedBoard ? (
        <main className="max-w-md mx-auto px-4 pt-6 pb-32 space-y-6">
          {boards.length > 0 ? (
            <div className="modern-card-grid">
              {boards.map((board: KanbanBoard) => (
                <div
                  key={board.id}
                  onClick={() => setSelectedBoard(board)}
                  className="modern-action-card bg-pastel-blue text-left cursor-pointer"
                >
                  {getIcon(
                    board.icon || "ClipboardList",
                    "h-5 w-5 mb-2 text-primary",
                  )}
                  <p className="font-medium text-sm text-foreground">
                    {board.name}
                  </p>
                  {board.description && (
                    <p className="text-xs text-muted-foreground">
                      {board.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-10 text-center border border-border">
              <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Inga tavlor tillgängliga
              </h3>
              <p className="text-muted-foreground mb-6">
                Skapa en ny tavla för att börja organisera ditt arbete visuellt.
              </p>
              <Button onClick={handleCreateBoard}>
                <Plus className="mr-2 h-4 w-4" />
                Ny Tavla
              </Button>
            </div>
          )}
        </main>
      ) : (
        /* Board View */
        <div className="space-y-4">
         {/* Columns */}
          {columnsLoading ? (
            <div className="text-center py-8">Laddar kolumner...</div>
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.isArray(columns) &&
                  columns.map((column: KanbanColumn) => {
                  const columnCards = getCardsForColumn(column.id);
                  return (
                    <DroppableColumn
                      key={column.id}
                      column={column}
                      onEdit={handleEditColumn}
                      onDelete={handleDeleteColumn}
                      cardCount={columnCards.length}
                      canDelete={selectedBoard?.ownerUserId === user?.id}
                    >
                      <div className="mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground hover:text-foreground"
                          onClick={() => handleCreateCard(column.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Lägg till kort
                        </Button>
                      </div>
                      <SortableContext
                        items={columnCards.map(card => card.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {columnCards.map((card: KanbanCard) => (
                          <SortableCard
                            key={card.id}
                            card={card}
                            onEdit={handleEditCard}
                          />
                        ))}
                      </SortableContext>
                    </DroppableColumn>
                  );
                })}
              </div>

              <DragOverlay>
                {activeId && activeType === "card" ? (
                  (() => {
                    const activeCard = allCards.find(card => card.id === activeId);
                    return activeCard ? (
                      <Card className="w-80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg rotate-3">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {getIcon(activeCard.icon || "FileText")}
                              <CardTitle className="text-sm">{activeCard.title}</CardTitle>
                            </div>
                            <Badge 
                              variant={
                                activeCard.priorityLevel === "high" ? "destructive" : 
                                activeCard.priorityLevel === "medium" ? "default" : 
                                "secondary"
                              }
                            >
                              {activeCard.priorityLevel}
                            </Badge>
                          </div>
                        </CardHeader>
                      </Card>
                    ) : null;
                  })()
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}

      {/* Modals */}
      <KanbanBoardModal
        open={showBoardModal}
        onOpenChange={setShowBoardModal}
        board={editingBoard}
        onSubmit={(data) => {
          if (editingBoard) {
            updateBoardMutation.mutate({ id: editingBoard.id, data });
          } else {
            createBoardMutation.mutate(data);
          }
        }}
        onDelete={
          editingBoard
            ? () => {
                deleteBoardMutation.mutate(editingBoard.id);
                setShowBoardModal(false);
              }
            : undefined
        }
      />

      <KanbanColumnModal
        open={showColumnModal}
        onOpenChange={setShowColumnModal}
        column={editingColumn}
        boardId={selectedBoard?.id}
        onSubmit={(data) => {
          if (editingColumn) {
            updateColumnMutation.mutate({ id: editingColumn.id, data });
          } else {
            createColumnMutation.mutate(data);
          }
        }}
      />

      <KanbanCardModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        card={editingCard}
        columnId={selectedColumnId}
        onSubmit={(data) => {
          createCardMutation.mutate(data);
        }}
      />
    </div>
  );
}

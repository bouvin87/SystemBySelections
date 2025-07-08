import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  Link,
  ArrowLeft,
  GripVertical,
  Trash2,
} from "lucide-react";
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
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  UniqueIdentifier,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Card Component
function SortableCard({
  card,
  onEdit,
}: {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
}) {
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
      {...attributes}
      onClick={() => onEdit(card)}
    >
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div {...listeners} className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </div>
          {getIcon(card.icon || "FileText")}
          <h4 className="font-semibold text-sm">{card.title}</h4>
        </div>
        {card.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
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
      </CardContent>
    </Card>
  );
}

// Sortable Column Component for Multiple Containers
function SortableColumn({
  column,
  cards,
  onEditColumn,
  onDeleteColumn,
  onEditCard,
  onCreateCard,
  canDelete,
}: {
  column: KanbanColumn;
  cards: KanbanCard[];
  onEditColumn: (column: KanbanColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  onEditCard: (card: KanbanCard) => void;
  onCreateCard: (columnId: string) => void;
  canDelete: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  const cardIds = cards.map(card => card.id);

  return (
    <div className="flex-shrink-0 w-80">
      <Card className="h-full transition-all duration-200 overflow-visible">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getIcon(column.icon || "List")}
              <CardTitle className="text-base">{column.title}</CardTitle>
              <Badge variant="secondary">{cards.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCreateCard(column.id)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditColumn(column)}
              >
                <Settings className="h-3 w-3" />
              </Button>
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteColumn(column.id)}
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
        <CardContent 
          className="space-y-2 overflow-visible min-h-[200px]" 
          ref={setNodeRef}
        >
          <div className="mb-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => onCreateCard(column.id)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Lägg till kort
            </Button>
          </div>
          <SortableContext 
            items={cardIds} 
            strategy={verticalListSortingStrategy}
          >
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onEdit={onEditCard}
              />
            ))}
          </SortableContext>
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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
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
  });

  // Fetch cards for all columns with forced refresh after moves
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
    staleTime: 0,  
    cacheTime: 1000 * 5,  
    refetchOnWindowFocus: true,  
  });

  // Helper function to get cards for a specific column
  const getCardsForColumn = (columnId: string): KanbanCard[] => {
    return allCards.filter((card: KanbanCard) => card.columnId === columnId);
  };

  // Find container (column) that contains a specific item (card)
  const findContainer = (id: UniqueIdentifier) => {
    if (columns.find(col => col.id === id)) {
      return id;
    }
    
    const card = allCards.find(card => card.id === id);
    return card ? card.columnId : null;
  };

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
      setEditingCard(null);
      toast({ title: "Kort skapat framgångsrikt" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => apiRequest("PATCH", `/api/kanban/cards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/cards", selectedBoard?.id],
      });
      setShowCardModal(false);
      setEditingCard(null);
      toast({ title: "Kort uppdaterat framgångsrikt" });
    },
  });

  // Move card mutation with instant UI update
  const moveCardMutation = useMutation({
    mutationFn: async ({ cardId, newColumnId, position }: { cardId: string, newColumnId: string, position: number }) => {
      return await apiRequest("POST", `/api/kanban/cards/${cardId}/move`, { 
        columnId: newColumnId, 
        position 
      });
    },
    onSuccess: () => {
      // Multiple invalidation strategies for maximum responsiveness
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/cards"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/boards"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/kanban/columns"],
      });
      
      // Force immediate refetch
      queryClient.refetchQueries({
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

  // Event handlers
  const handleCreateBoard = () => {
    setEditingBoard(null);
    setShowBoardModal(true);
  };

  const handleEditBoard = (board: KanbanBoard) => {
    setEditingBoard(board);
    setShowBoardModal(true);
  };

  const handleDeleteBoard = (boardId: string) => {
    if (confirm("Är du säker på att du vill ta bort denna tavla? Alla kolumner och kort kommer också att tas bort.")) {
      deleteBoardMutation.mutate(boardId);
    }
  };

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
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the containers
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // This is the logic for moving cards between columns
    const activeItems = getCardsForColumn(activeContainer as string);
    const overItems = getCardsForColumn(overContainer as string);

    // Find the indexes for the items
    const activeIndex = activeItems.findIndex(item => item.id === activeId);
    const overIndex = overItems.findIndex(item => item.id === overId);

    let newIndex: number;
    if (overId in columns.reduce((acc, col) => ({ ...acc, [col.id]: col }), {})) {
      // We're at the root droppable of a container
      newIndex = overItems.length + 1;
    } else {
      const isBelowOverItem = over && over.rect?.current?.translated &&
        over.rect.current.translated.top > over.rect.current.top + over.rect.current.height;
      const modifier = isBelowOverItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
    }

    // Don't do anything if we're dropping in the same place
    if (activeIndex === newIndex && activeContainer === overContainer) {
      return;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer) {
      return;
    }

    if (activeContainer === overContainer) {
      // Same container - reorder within column
      const activeItems = getCardsForColumn(activeContainer as string);
      const activeIndex = activeItems.findIndex(item => item.id === activeId);
      const overIndex = activeItems.findIndex(item => item.id === overId);

      if (activeIndex !== overIndex) {
        const sortedItems = arrayMove(activeItems, activeIndex, overIndex);
        // Update positions and move card
        moveCardMutation.mutate({
          cardId: activeId as string,
          newColumnId: activeContainer as string,
          position: overIndex
        });
      }
    } else {
      // Different containers - move between columns
      const overItems = getCardsForColumn(overContainer as string);
      const overIndex = overItems.findIndex(item => item.id === overId);
      const insertIndex = overIndex >= 0 ? overIndex : overItems.length;

      moveCardMutation.mutate({
        cardId: activeId as string,
        newColumnId: overContainer as string,
        position: insertIndex
      });
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

      {!selectedBoard ? (
        // Board selection view
        <div className="container mx-auto px-4 pt-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Kanban Tavlor</h1>
            <Button onClick={handleCreateBoard}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa Tavla
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board: KanbanBoard) => {
              const getIcon = (iconName: string) => {
                const Icon = (Icons as any)[iconName] || Icons.Star;
                return <Icon className="h-5 w-5" />;
              };

              return (
                <Card
                  key={board.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200"
                  onClick={() => setSelectedBoard(board)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getIcon(board.icon || "Star")}
                        <CardTitle className="text-lg">{board.name}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        {board.isPublic && (
                          <Badge variant="secondary">
                            <Link className="h-3 w-3 mr-1" />
                            Offentlig
                          </Badge>
                        )}
                        {board.ownerUserId === user?.id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditBoard(board);
                              }}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBoard(board.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {board.description && (
                      <p className="text-sm text-muted-foreground">
                        {board.description}
                      </p>
                    )}
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        // Kanban board view
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="container mx-auto px-4 pt-8">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBoard(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Tillbaka
                </Button>
                <h1 className="text-3xl font-bold">{selectedBoard.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleCreateColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ny Kolumn
                </Button>
              </div>
            </div>

            {columnsLoading ? (
              <div className="text-center">Laddar kolumner...</div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-6">
                {columns.map((column: KanbanColumn) => {
                  const columnCards = getCardsForColumn(column.id);
                  return (
                    <SortableColumn
                      key={column.id}
                      column={column}
                      cards={columnCards}
                      onEditColumn={handleEditColumn}
                      onDeleteColumn={handleDeleteColumn}
                      onEditCard={handleEditCard}
                      onCreateCard={handleCreateCard}
                      canDelete={selectedBoard?.ownerUserId === user?.id}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="opacity-50">
                {(() => {
                  const draggedCard = allCards.find(card => card.id === activeId);
                  return draggedCard ? (
                    <SortableCard
                      card={draggedCard}
                      onEdit={() => {}}
                    />
                  ) : null;
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Modals */}
      <KanbanBoardModal
        isOpen={showBoardModal}
        onClose={() => {
          setShowBoardModal(false);
          setEditingBoard(null);
        }}
        board={editingBoard}
        onSubmit={(data) => {
          if (editingBoard) {
            updateBoardMutation.mutate({ id: editingBoard.id, data });
          } else {
            createBoardMutation.mutate(data);
          }
        }}
        isLoading={createBoardMutation.isPending || updateBoardMutation.isPending}
      />

      <KanbanColumnModal
        isOpen={showColumnModal}
        onClose={() => {
          setShowColumnModal(false);
          setEditingColumn(null);
        }}
        column={editingColumn}
        boardId={selectedBoard?.id || ""}
        onSubmit={(data) => {
          if (editingColumn) {
            updateColumnMutation.mutate({ id: editingColumn.id, data });
          } else {
            createColumnMutation.mutate({ ...data, boardId: selectedBoard?.id });
          }
        }}
        isLoading={createColumnMutation.isPending || updateColumnMutation.isPending}
      />

      <KanbanCardModal
        isOpen={showCardModal}
        onClose={() => {
          setShowCardModal(false);
          setEditingCard(null);
          setSelectedColumnId(null);
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
        isLoading={createCardMutation.isPending || updateCardMutation.isPending}
      />
    </div>
  );
}
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
import {
  ArrowLeft,
  Plus,
  Settings,
  Trash2,
  GripVertical,
  MessageSquare,
  Eye,
  MessageSquarePlus,
  Pencil,
  Paperclip,
} from "lucide-react";
import * as Icons from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { KanbanBoardModal } from "@/components/Kanban/KanbanBoardModal";
import ContextMenu, { ContextMenuEntry } from "@/components/Kanban/ContextMenu";

interface KanbanCardComponentProps {
  card: KanbanCard;
  onEdit: (card: KanbanCard) => void;
  onContextMenu?: (e: React.MouseEvent, cardId: string) => void;
  isOwner?: boolean;
}

function KanbanCardComponent({
  card,
  onEdit,
  onContextMenu,
  isOwner 
}: KanbanCardComponentProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card.id });

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
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onContextMenu) onContextMenu(e, card.id);
      }}
      onClick={(e) => {
        // Alternativt: tryck-ikon istället för hela kortet
        if (onContextMenu) onContextMenu(e, card.id);
      }}
      className="relative bg-background/80 rounded-2xl border border-border cursor-pointer hover:shadow-md transition-shadow touch-manipulation select-none"
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          {/* Ikon + titel */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getIcon(card.icon || "FileText")}
            <span className="text-sm font-medium truncate">{card.title}</span>
          </div>

          {/* Åtgärder */}
          <div className="flex items-center gap-1">
            {isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="p-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded"
              style={{ touchAction: "none" }}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Beskrivning */}
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
  board: any;
}

function KanbanColumnComponent({
  column,
  items,
  onCreateCard,
  onEditColumn,
  onDeleteColumn,
  onEditCard,
  board,
  onCardContextMenu,
}: KanbanColumnComponentProps & {
  onCardContextMenu?: (e: React.MouseEvent, cardId: string) => void; // 👈 extra prop om du vill skicka in
}) {
  const queryClient = useQueryClient();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.List;
    return <Icon className="h-4 w-4" />;
  };

  const { user } = useAuth();
  const isOwner =
    user?.id === board.ownerUserId ||
    user?.role === "admin" ||
    user?.role === "superadmin";

  return (
    <Card
      ref={setNodeRef}
      className={`min-w-[300px] max-w-[300px] bg-card border border-border rounded-2xl shadow-xs ${
        isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon(column.icon || "List")}
            <CardTitle className="text-base font-semibold">
              {column.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            {isOwner && (
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
            )}
          </div>
        </div>
        {column.description && (
          <p className="text-sm text-muted-foreground leading-snug">
            {column.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-2 min-h-[300px] p-4">
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((card) => (
            <KanbanCardComponent
              key={card.id}
              card={card}
              onEdit={onEditCard}
              isOwner={isOwner}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // 👇 Du måste ha denna funktion i din överordnade komponent
                if (typeof onCardContextMenu === "function") {
                  onCardContextMenu(e, card.id);
                }
              }}
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
  const boardId = location.split("/")[2];
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [menuCardId, setMenuCardId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [defaultCardTab, setDefaultCardTab] = useState<"details" | "comments" | "attachments">("details");

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

  // Fetch user preferences for this board
  const { data: userPreference } = useQuery({
    queryKey: [`/api/kanban/preferences/${boardId}`],
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
    return [...columns].sort(
      (a: KanbanColumn, b: KanbanColumn) => a.position - b.position,
    );
  }, [columns]);

  // Get all items (columns and cards) for DndContext
  const items = useMemo(() => {
    const columnIds = sortedColumns.map((col) => col.id);
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
    mutationFn: async ({
      cardId,
      newColumnId,
      newPosition,
    }: {
      cardId: string;
      newColumnId: string;
      newPosition: number;
    }) => {
      return apiRequest("POST", `/api/kanban/cards/${cardId}/move`, {
        columnId: newColumnId,
        position: newPosition,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/kanban/boards/${boardId}/cards`],
      });
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
    }),
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
    const activeCard = allCards.find(
      (card: KanbanCard) => card.id === activeId,
    );
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

    const activeCard = allCards.find(
      (card: KanbanCard) => card.id === activeId,
    );
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
      const oldIndex = columnCards.findIndex((card) => card.id === activeId);
      const newIndex = columnCards.findIndex((card) => card.id === overId);

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
  const updateBoardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/kanban/boards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/kanban/boards/${boardId}`],
      }); // enskild tavla
      queryClient.invalidateQueries({
        queryKey: [`/api/kanban/preferences/${boardId}`],
      }); // användarpreferenser

      setShowBoardModal(false);
      setEditingBoard(null);
      toast({
        title: "Tavla uppdaterad",
        description: "Tavlan och preferenserna har uppdaterats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Det gick inte att uppdatera tavlan.",
        variant: "destructive",
      });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) =>
      apiRequest("DELETE", `/api/kanban/boards/${boardId}`),
    onSuccess: () => {
      toast({
        title: "Tavla borttagen",
        description: "Tavlan har tagits bort framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });

      navigate("/kanban");
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Det gick inte att ta bort tavlan.",
        variant: "destructive",
      });
    },
  });

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
      toast({
        title: "Kolumn borttagen",
        description: "Kolumnen har tagits bort framgångsrikt.",
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/kanban/boards/${boardId}/columns`],
      });
      queryClient.invalidateQueries({
        queryKey: [`/api/kanban/boards/${boardId}/cards`],
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort kolumnen.",
        variant: "destructive",
      });
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
    setDefaultCardTab("details");
    setShowCardModal(true);
  };
  const handleEditBoard = (board: KanbanBoard) => {
    setEditingBoard(board);
    setShowBoardModal(true);
  };
  const handleDeleteBoard = (boardId: string) => {
    if (
      confirm(
        "Är du säker på att du vill ta bort denna tavla? Alla kolumner och kort kommer också att tas bort.",
      )
    ) {
      deleteBoardMutation.mutate(boardId);
    }
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

  const isOwner =
    user?.id === board.ownerUserId ||
    user?.role === "admin" ||
    user?.role === "superadmin";

  // Menu

  const handleCardMenuOpen = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Alltid nollställ meny först (för att trigga re-render)
    setMenuCardId(null);
    setMenuPosition(null);

    // Vänta ett "tick" innan vi sätter nytt, så React får stänga gamla först
    setTimeout(() => {
      setMenuCardId(cardId);
      setMenuPosition({ x: e.clientX, y: e.clientY });
    }, 0);
  };

  const handleMenuClose = () => {
    setMenuCardId(null);
    setMenuPosition(null);
  };

  const getCardMenuEntries = (): ContextMenuEntry[] => [
    {
      id: "edit",
      label: "Redigera kort",
      icon: <Pencil className="w-4 h-4" />,
      onClick: () => {
        const card = allCards.find((c) => c.id === menuCardId);
        if (card) handleEditCard(card);
      },
    },
    {
      id: "divider-1",
      type: "divider",
    },
    {
      id: "comments",
      label: "Kommentarer",
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => {
        const card = allCards.find((c) => c.id === menuCardId);
        if (card) {
          setEditingCard(card);
          setDefaultCardTab("comments");
          setShowCardModal(true);
        }
      },
    },
    {
      id: "attachments",
      label: "Bilagor",
      icon: <Paperclip className="w-4 h-4" />,
      onClick: () => {
        const card = allCards.find((c) => c.id === menuCardId);
        if (card) {
          setEditingCard(card);
          setDefaultCardTab("attachments");
          setShowCardModal(true);
        }
      },
    },

  ];
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ touchAction: "pan-y" }}
    >
      <Navigation />
      {/* Menyrad */}
      <div className="bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Vänstersida */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/kanban")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {board.name}
                </h1>
                {board.description && (
                  <p className="text-sm text-muted-foreground">
                    {board.description}
                  </p>
                )}
              </div>
            </div>

            {/* Högersida */}

            <div className="flex gap-2">
              <Button
                onClick={() => handleEditBoard(board)}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
              {isOwner && (
                <Button
                  onClick={handleCreateColumn}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ny kolumn
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <main className="mx-auto px-4 pt-6 pb-32 space-y-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={true}
        >
          <div className="overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="flex gap-4 w-max px-4">
              {sortedColumns.map((column: KanbanColumn) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  items={cardsByColumn[column.id] || []}
                  onCreateCard={handleCreateCard}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onEditCard={handleEditCard}
                  board={board}
                  onCardContextMenu={handleCardMenuOpen} 
                  isOwner={isOwner}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeCard ? (
              <KanbanCardComponent
                card={activeCard}
                onEdit={() => {}}
                isOwner={isOwner}
                
              />
            ) : null}
          </DragOverlay>
        </DndContext>
        {menuPosition && menuCardId && (
          <>
            {console.log("✅ ContextMenu ska visas:", menuPosition, menuCardId)}
            <ContextMenu
              x={menuPosition.x}
              y={menuPosition.y}
              entries={getCardMenuEntries()}
              onClose={handleMenuClose}
            />
          </>
        )}
      </main>
      {/* Modals */}
      <KanbanColumnModal
        open={showColumnModal}
        onOpenChange={setShowColumnModal}
        boardId={boardId}
        board={board}
        column={editingColumn}
        onSubmit={async (data) => {
          try {
            if (editingColumn) {
              await apiRequest(
                "PATCH",
                `/api/kanban/columns/${editingColumn.id}`,
                data,
              );
            } else {
              await apiRequest("POST", `/api/kanban/columns`, {
                ...data,
                boardId,
              });
            }
            setShowColumnModal(false);
            setEditingColumn(null);
            queryClient.invalidateQueries({
              queryKey: [`/api/kanban/boards/${boardId}/columns`],
            });
            toast({
              title: "Kolumn sparad",
              description: "Kolumnen har sparats framgångsrikt.",
            });
          } catch (error: any) {
            toast({
              title: "Fel",
              description: error.message || "Kunde inte spara kolumnen.",
              variant: "destructive",
            });
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
        columnId={selectedColumnId || ""}
        board={board}
        card={editingCard}
        defaultTab={defaultCardTab}
      />
      <KanbanBoardModal
        open={showBoardModal}
        onOpenChange={(open) => {
          setShowBoardModal(open);
          if (!open) setEditingBoard(null);
        }}
        board={editingBoard}
        userPreference={userPreference}
        onSubmit={(data) => {
          if (editingBoard) {
            updateBoardMutation.mutate({ id: editingBoard.id, data });
          }
        }}
        onDelete={
          editingBoard ? () => handleDeleteBoard(editingBoard.id) : undefined
        }
      />
    </div>
  );
}

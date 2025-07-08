import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal, Settings } from "lucide-react";
import * as Icons from "lucide-react";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@shared/schema";
import { KanbanBoardModal } from "@/components/Kanban/KanbanBoardModal";
import { KanbanColumnModal } from "@/components/Kanban/KanbanColumnModal";
import { KanbanCardModal } from "@/components/Kanban/KanbanCardModal";
import { useToast } from "@/hooks/use-toast";

export default function KanbanPage() {
  const [selectedBoard, setSelectedBoard] = useState<KanbanBoard | null>(null);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all boards
  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ["/api/kanban/boards"],
  });

  // Fetch columns for selected board
  const { data: columns = [], isLoading: columnsLoading } = useQuery({
    queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"],
    queryFn: () => apiRequest("GET", `/api/kanban/boards/${selectedBoard?.id}/columns`),
    enabled: !!selectedBoard?.id,
  });

  // Fetch cards for all columns
  const { data: allCards = [] } = useQuery({
    queryKey: ["/api/kanban/cards", selectedBoard?.id],
    queryFn: async () => {
      if (!columns.length) return [];
      const cardPromises = columns.map((column: KanbanColumn) =>
        apiRequest("GET", `/api/kanban/columns/${column.id}/cards`)
      );
      const cardArrays = await Promise.all(cardPromises);
      return cardArrays.flat();
    },
    enabled: !!selectedBoard?.id && columns.length > 0,
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
    mutationFn: (id: string) => apiRequest("DELETE", `/api/kanban/boards/${id}`),
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
        queryKey: ["/api/kanban/boards", selectedBoard?.id, "columns"] 
      });
      setShowColumnModal(false);
      toast({ title: "Kolumn skapad framgångsrikt" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/kanban/cards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/kanban/cards", selectedBoard?.id] 
      });
      setShowCardModal(false);
      toast({ title: "Kort skapat framgångsrikt" });
    },
  });

  // Helper functions
  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getCardsForColumn = (columnId: string) => {
    return allCards.filter((card: KanbanCard) => card.columnId === columnId)
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

  if (boardsLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Laddar tavlor...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Kanban Tavlor</h1>
          <p className="text-muted-foreground">
            Organisera ditt arbete med anpassningsbara Kanban-tavlor
          </p>
        </div>
        <Button onClick={handleCreateBoard} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ny Tavla
        </Button>
      </div>

      {/* Board Selection */}
      {!selectedBoard ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board: KanbanBoard) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedBoard(board)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(board.icon || "ClipboardList")}
                    <CardTitle className="text-lg">{board.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditBoard(board);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {board.description || "Ingen beskrivning"}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={board.isPublic ? "default" : "secondary"}>
                    {board.isPublic ? "Offentlig" : "Privat"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Board View */
        <div className="space-y-4">
          {/* Board Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setSelectedBoard(null)}>
                ← Tillbaka till tavlor
              </Button>
              <div className="flex items-center gap-2">
                {getIcon(selectedBoard.icon || "ClipboardList")}
                <h2 className="text-2xl font-bold">{selectedBoard.name}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCreateColumn}>
                <Plus className="h-4 w-4 mr-2" />
                Ny Kolumn
              </Button>
              <Button variant="outline" onClick={() => handleEditBoard(selectedBoard)}>
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Columns */}
          {columnsLoading ? (
            <div className="text-center py-8">Laddar kolumner...</div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {Array.isArray(columns) && columns.map((column: KanbanColumn) => {
                const columnCards = getCardsForColumn(column.id);
                return (
                  <div key={column.id} className="flex-shrink-0 w-80">
                    <Card className="h-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getIcon(column.icon || "List")}
                            <CardTitle className="text-base">{column.title}</CardTitle>
                            <Badge variant="secondary">{columnCards.length}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCreateCard(column.id)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {column.description && (
                          <p className="text-sm text-muted-foreground">
                            {column.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {columnCards.map((card: KanbanCard) => (
                          <Card key={card.id} className="p-3 cursor-pointer hover:shadow-sm">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                {getIcon(card.icon || "FileText")}
                                <span className="font-medium text-sm">{card.title}</span>
                              </div>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                            {card.description && (
                              <p className="text-xs text-muted-foreground mt-2">
                                {card.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-2">
                              {card.labels?.map((label) => (
                                <Badge key={label} variant="outline" className="text-xs">
                                  {label}
                                </Badge>
                              ))}
                              {card.priorityLevel && card.priorityLevel !== "medium" && (
                                <Badge 
                                  variant={card.priorityLevel === "high" || card.priorityLevel === "urgent" ? "destructive" : "default"}
                                  className="text-xs"
                                >
                                  {card.priorityLevel}
                                </Badge>
                              )}
                            </div>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
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
        onDelete={editingBoard ? () => {
          deleteBoardMutation.mutate(editingBoard.id);
          setShowBoardModal(false);
        } : undefined}
      />

      <KanbanColumnModal
        open={showColumnModal}
        onOpenChange={setShowColumnModal}
        column={editingColumn}
        boardId={selectedBoard?.id}
        onSubmit={(data) => {
          createColumnMutation.mutate(data);
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
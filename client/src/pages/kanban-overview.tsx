import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  Eye,
  Users,
  Lock,
  Trash2,
} from "lucide-react";
import * as Icons from "lucide-react";
import { KanbanBoard } from "@shared/schema";
import { KanbanBoardModal } from "@/components/Kanban/KanbanBoardModal";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

interface BoardCardProps {
  board: KanbanBoard;
  onEdit: (board: KanbanBoard) => void;
  onDelete: (boardId: string) => void;
  onView: (boardId: string) => void;
}

function BoardCard({ board, onEdit, onDelete, onView }: BoardCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === board.ownerUserId;

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName] || Icons.ClipboardList;
    return <Icon className="h-5 w-5" />;
  };

  const getVisibilityIcon = () => {
    if (board.isPublic) {
      return <Users className="h-4 w-4 text-green-600" />;
    }
    return <Lock className="h-4 w-4 text-orange-600" />;
  };

  const getVisibilityText = () => {
    return board.isPublic ? "Offentlig" : "Privat";
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {getIcon(board.icon || "ClipboardList")}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">
                {board.name}
              </CardTitle>
              {board.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {board.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(board.id);
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {isOwner && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(board);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(board.id);
                  }}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent
        className="pt-0 cursor-pointer"
        onClick={() => onView(board.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getVisibilityIcon()}
            <span className="text-sm text-muted-foreground">
              {getVisibilityText()}
            </span>
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date(board.createdAt).toLocaleDateString('sv-SE')}
          </Badge>
        </div>
        {isOwner && (
          <div className="mt-2 text-xs text-muted-foreground">
            Du äger denna tavla
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function KanbanOverview() {
  const [, navigate] = useLocation();
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState<KanbanBoard | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all boards
  const { data: boards = [], isLoading } = useQuery({
    queryKey: ["/api/kanban/boards"],
    onSuccess: (data) => {
      console.log("Kanban Overview - Fetched boards:", data);
    },
  });

  // Mutations
  const createBoardMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/kanban/boards`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setShowBoardModal(false);
      setEditingBoard(null);
      toast({
        title: "Tavla skapad",
        description: "Din nya Kanban-tavla har skapats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Det gick inte att skapa tavlan.",
        variant: "destructive",
      });
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/kanban/boards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setShowBoardModal(false);
      setEditingBoard(null);
      toast({
        title: "Tavla uppdaterad",
        description: "Tavlan har uppdaterats framgångsrikt.",
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
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      toast({
        title: "Tavla borttagen",
        description: "Tavlan har tagits bort framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Det gick inte att ta bort tavlan.",
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

  const handleViewBoard = (boardId: string) => {
    navigate(`/kanban/${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-lg">Laddar tavlor...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kanban Tavlor</h1>
            <p className="text-muted-foreground mt-2">
              Hantera dina projekt med visuella tavlor
            </p>
          </div>
          <Button onClick={handleCreateBoard} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Ny tavla
          </Button>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Icons.ClipboardList className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Inga tavlor ännu</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Kom igång genom att skapa din första Kanban-tavla för att organisera ditt arbete.
            </p>
            <Button onClick={handleCreateBoard}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa din första tavla
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board: KanbanBoard) => (
              <BoardCard
                key={board.id}
                board={board}
                onEdit={handleEditBoard}
                onDelete={handleDeleteBoard}
                onView={handleViewBoard}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <KanbanBoardModal
          open={showBoardModal}
          onOpenChange={(open) => {
            setShowBoardModal(open);
            if (!open) setEditingBoard(null);
          }}
          board={editingBoard}
          onSubmit={(data) => {
            if (editingBoard) {
              updateBoardMutation.mutate({ id: editingBoard.id, data });
            } else {
              createBoardMutation.mutate(data);
            }
          }}
          onDelete={editingBoard ? () => handleDeleteBoard(editingBoard.id) : undefined}
        />
      </div>
    </div>
  );
}
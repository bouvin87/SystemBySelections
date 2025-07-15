import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, Edit2, Save, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KanbanCardComment {
  id: string;
  cardId: string;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userName: string;
  userEmail: string;
}

interface KanbanCardCommentsProps {
  cardId: string;
  currentUserId: number;
}

export function KanbanCardComments({ cardId, currentUserId }: KanbanCardCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery<KanbanCardComment[]>({
    queryKey: ["kanban", "cards", cardId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/kanban/cards/${cardId}/comments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/kanban/cards/${cardId}/comments`, {
        method: "POST",
        body: { content },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "cards", cardId, "comments"] });
      setNewComment("");
      toast({
        title: "Kommentar tillagd",
        description: "Din kommentar har lagts till.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kommentar.",
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: string; content: string }) => {
      return apiRequest(`/api/kanban/cards/comments/${commentId}`, {
        method: "PATCH",
        body: { content },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "cards", cardId, "comments"] });
      setEditingCommentId(null);
      setEditContent("");
      toast({
        title: "Kommentar uppdaterad",
        description: "Din kommentar har uppdaterats.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera kommentar.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      return apiRequest(`/api/kanban/cards/comments/${commentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kanban", "cards", cardId, "comments"] });
      toast({
        title: "Kommentar borttagen",
        description: "Kommentaren har tagits bort.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort kommentar.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editContent });
  };

  const startEditing = (comment: KanbanCardComment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Kommentarer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laddar kommentarer...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Kommentarer ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment List */}
        {comments.length > 0 ? (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {comment.userName.split(" ").map((n) => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.userName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.createdAt), "d MMM HH:mm", { locale: sv })}
                      </span>
                      {comment.createdAt !== comment.updatedAt && (
                        <span className="text-xs text-muted-foreground">(redigerad)</span>
                      )}
                    </div>
                    {comment.userId === currentUserId && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => startEditing(comment)}
                          disabled={editingCommentId === comment.id}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-destructive hover:text-destructive"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="text-sm min-h-[60px]"
                        placeholder="Redigera kommentar..."
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateComment(comment.id)}
                          disabled={updateCommentMutation.isPending || !editContent.trim()}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Spara
                        </Button>
                        <Button variant="outline" size="sm" onClick={cancelEditing}>
                          <X className="h-3 w-3 mr-1" />
                          Avbryt
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Inga kommentarer ännu. Var först med att kommentera!
          </div>
        )}

        {/* New Comment Form */}
        <div className="space-y-3 pt-3 border-t">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Skriv en kommentar..."
            className="text-sm min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={createCommentMutation.isPending || !newComment.trim()}
            >
              <Send className="h-3 w-3 mr-1" />
              Skicka kommentar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
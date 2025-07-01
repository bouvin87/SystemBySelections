// components/ui/commentthread.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";
import { Label } from "@/components/ui/label";

interface Comment {
  id: number;
  userId: number;
  comment: string;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface CommentThreadProps {
  resourceId: number;
  resourceType: "deviation" | string;
}

export default function CommentThread({ resourceId, resourceType }: CommentThreadProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/${resourceType}s/${resourceId}/comments`],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createComment = useMutation({
    mutationFn: async (comment: string) => {
      const res = await fetch(`/api/${resourceType}s/${resourceId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ comment }),
      });
      if (!res.ok) throw new Error("Kunde inte spara kommentaren");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${resourceType}s/${resourceId}/comments`] });
      setNewComment("");
      toast({ title: "Kommentar tillagd", description: "Din kommentar har sparats." });
    },
    onError: () => {
      toast({ title: "Fel", description: "Kunde inte spara kommentaren", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) createComment.mutate(newComment.trim());
  };

  return (
    <div className="space-y-6">
      {/* New comment input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Label htmlFor="comment" className="text-sm font-medium text-muted-foreground">Ny kommentar</Label>
        <Textarea
          id="comment"
          rows={3}
          placeholder="Skriv en kommentar..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || createComment.isPending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Skicka
        </Button>
      </form>

      {/* List of comments */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laddar kommentarer...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga kommentarer ännu.</p>
        ) : (
          comments.map((c) => {
            const author = users.find((u) => u.id === c.userId);
            const displayName = author
              ? `${author.firstName || ""} ${author.lastName || ""}`.trim() || author.email
              : "Okänd användare";

            return (
              <div key={c.id} className="border border-border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(c.createdAt), "d MMM yyyy HH:mm", { locale: sv })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{c.comment}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

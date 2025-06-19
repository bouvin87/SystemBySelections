import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import DeviationModal from "@/components/DeviationModal";
import {
  ArrowLeft,
  Edit,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  History,
  Send,
} from "lucide-react";

interface Deviation {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  deviationTypeId: number;
  priorityId?: number;
  statusId?: number;
  assignedToUserId?: number;
  createdByUserId: number;
  dueDate?: string;
  completedAt?: string;
  workTaskId?: number;
  locationId?: number;
  createdAt: string;
  updatedAt: string;
}

interface DeviationType {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface DeviationPriority {
  id: number;
  tenantId: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeviationStatus {
  id: number;
  tenantId: number;
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  isDefault: boolean;
}

interface DeviationUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface DeviationComment {
  id: number;
  deviationId: number;
  userId: number;
  comment: string;
  createdAt: string;
}

interface DeviationLog {
  id: number;
  deviationId: number;
  userId: number;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
}

interface WorkTask {
  id: number;
  name: string;
}

interface WorkStation {
  id: number;
  name: string;
}

// Activity Log Component
function DeviationActivityLog({ deviationId }: { deviationId: number }) {
  const { data: logs = [], isLoading } = useQuery<DeviationLog[]>({
    queryKey: [`/api/deviations/${deviationId}/logs`],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  if (isLoading) {
    return <div className="text-sm text-gray-500">Laddar aktivitetslogg...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-sm text-gray-500">Inga aktiviteter ännu</div>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {logs.map((log) => {
        const user = users.find((u) => u.id === log.userId);
        const userName = user
          ? `${user.firstName} ${user.lastName}`.trim() || user.email
          : "Okänd användare";

        return (
          <div key={log.id} className="border-l-2 border-gray-200 pl-3 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{log.description}</p>
              <span className="text-xs text-gray-500">
                {format(new Date(log.createdAt), "d MMM yyyy HH:mm", {
                  locale: sv,
                })}
              </span>
            </div>
            <p className="text-xs text-gray-600">av {userName}</p>
            {log.oldValue && log.newValue && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="line-through">{log.oldValue}</span> → {log.newValue}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Comments Component
function DeviationComments({ deviationId }: { deviationId: number }) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery<DeviationComment[]>({
    queryKey: [`/api/deviations/${deviationId}/comments`],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  const createCommentMutation = useMutation({
    mutationFn: (comment: string) =>
      apiRequest(`/api/deviations/${deviationId}/comments`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/deviations/${deviationId}/comments`],
      });
      setNewComment("");
      toast({
        title: "Kommentar tillagd",
        description: "Din kommentar har sparats",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Kunde inte spara kommentaren",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      createCommentMutation.mutate(newComment.trim());
    }
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Laddar kommentarer...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add new comment */}
      <form onSubmit={handleSubmitComment} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Skriv en kommentar..."
          rows={3}
        />
        <Button
          type="submit"
          disabled={!newComment.trim() || createCommentMutation.isPending}
          size="sm"
        >
          <Send className="w-4 h-4 mr-2" />
          Skicka
        </Button>
      </form>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-sm text-gray-500">Inga kommentarer ännu</div>
        ) : (
          comments.map((comment) => {
            const user = users.find((u) => u.id === comment.userId);
            const userName = user
              ? `${user.firstName} ${user.lastName}`.trim() || user.email
              : "Okänd användare";

            return (
              <div
                key={comment.id}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{userName}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(comment.createdAt), "d MMM yyyy HH:mm", {
                      locale: sv,
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{comment.comment}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DeviationDetailPage() {
  const { id } = useParams();
  const deviationId = parseInt(id || "0");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch deviation
  const { data: deviation, isLoading } = useQuery<Deviation>({
    queryKey: [`/api/deviations/${deviationId}`],
    enabled: !!deviationId,
  });

  // Fetch deviation types
  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
  });

  // Fetch deviation priorities
  const { data: priorities = [] } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
  });

  // Fetch deviation statuses
  const { data: statuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
  });

  // Fetch users
  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  // Fetch work tasks
  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  // Fetch work stations
  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Laddar avvikelse...</div>
        </div>
      </div>
    );
  }

  if (!deviation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Avvikelse hittades inte</div>
        </div>
      </div>
    );
  }

  const deviationType = deviationTypes.find((t) => t.id === deviation.deviationTypeId);
  const priority = priorities.find((p) => p.id === deviation.priorityId);
  const status = statuses.find((s) => s.id === deviation.statusId);
  const assignedUser = users.find((u) => u.id === deviation.assignedToUserId);
  const createdByUser = users.find((u) => u.id === deviation.createdByUserId);
  const workTask = workTasks.find((w) => w.id === deviation.workTaskId);
  const workStation = workStations.find((w) => w.id === deviation.locationId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/deviations">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tillbaka
              </Button>
            </Link>
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Redigera
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {deviation.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Grundläggande information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deviation.description && (
                  <div>
                    <Label>Beskrivning</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {deviation.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Typ</Label>
                    {deviationType && (
                      <Badge
                        style={{
                          backgroundColor: deviationType.color,
                          color: "white",
                        }}
                        className="mt-1"
                      >
                        {deviationType.name}
                      </Badge>
                    )}
                  </div>

                  <div>
                    <Label>Status</Label>
                    {status && (
                      <Badge
                        style={{
                          backgroundColor: status.color,
                          color: "white",
                        }}
                        className="mt-1"
                      >
                        {status.name}
                      </Badge>
                    )}
                  </div>

                  {priority && (
                    <div>
                      <Label>Prioritet</Label>
                      <Badge
                        style={{
                          backgroundColor: priority.color,
                          color: "white",
                        }}
                        className="mt-1"
                      >
                        {priority.name}
                      </Badge>
                    </div>
                  )}

                  {assignedUser && (
                    <div>
                      <Label>Tilldelad till</Label>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {`${assignedUser.firstName} ${assignedUser.lastName}`.trim() ||
                          assignedUser.email}
                      </p>
                    </div>
                  )}

                  {workTask && (
                    <div>
                      <Label>Arbetsuppgift</Label>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {workTask.name}
                      </p>
                    </div>
                  )}

                  {workStation && (
                    <div>
                      <Label>Plats</Label>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {workStation.name}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Kommentarer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeviationComments deviationId={deviation.id} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Dates and Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Tidslinjer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Skapad</Label>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {format(
                      new Date(deviation.createdAt),
                      "d MMM yyyy HH:mm",
                      { locale: sv }
                    )}
                  </p>
                  {createdByUser && (
                    <p className="text-sm text-gray-500">
                      av{" "}
                      {`${createdByUser.firstName} ${createdByUser.lastName}`.trim() ||
                        createdByUser.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Senast uppdaterad</Label>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {format(
                      new Date(deviation.updatedAt),
                      "d MMM yyyy HH:mm",
                      { locale: sv }
                    )}
                  </p>
                </div>

                {deviation.dueDate && (
                  <div>
                    <Label>Deadline</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {format(
                        new Date(deviation.dueDate),
                        "d MMM yyyy HH:mm",
                        { locale: sv }
                      )}
                    </p>
                  </div>
                )}

                {deviation.completedAt && (
                  <div>
                    <Label>Slutförd</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {format(
                        new Date(deviation.completedAt),
                        "d MMM yyyy HH:mm",
                        { locale: sv }
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Aktivitetslogg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DeviationActivityLog deviationId={deviation.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <DeviationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        deviation={deviation}
        mode="edit"
      />
    </div>
  );
}
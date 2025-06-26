import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import DeviationModal from "@/components/DeviationModal";
import { AttachmentList } from "@/components/AttachmentList";
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
  CheckCircle,
  Edit3,
  Mail,
  Tag,
  Plus,
} from "lucide-react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import "react-vertical-timeline-component/style.min.css";

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
  departmentId?: number;
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
interface Department {
  id: number;
  tenantId: number;
  name: string;
  description?: string;
  isActive: boolean;
  order: number;
  responsibleUserId?: number;
  createdAt: string;
  updatedAt: string;
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
function getIconForLog(log: DeviationLog): {
  icon: JSX.Element;
  color: string;
} {
  if (log.action?.toLowerCase().includes("kommentar")) {
    return { icon: <MessageSquare size={16} />, color: "#10b981" }; // grön
  }

  if (log.field === "statusId") {
    return { icon: <CheckCircle size={16} />, color: "#3b82f6" }; // blå
  }

  if (log.field === "assignedToUserId") {
    return { icon: <User size={16} />, color: "#eab308" }; // gul
  }

  if (log.field === "priorityId") {
    return { icon: <AlertTriangle size={16} />, color: "#f97316" }; // orange
  }

  // Standard
  return { icon: <Edit3 size={16} />, color: "#9ca3af" }; // grå
}

// Activity Log Component
function DeviationActivityLog({ deviationId }: { deviationId: number }) {
  const { t } = useTranslation();
  const { data: logs = [], isLoading } = useQuery<DeviationLog[]>({
    queryKey: [`/api/deviations/${deviationId}/logs`],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: priorities = [] } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
  });

  const { data: statuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
  });

  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
  });

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  // Function to map ID values to readable names
  const mapFieldValue = (field: string, value: string | undefined): string => {
    if (!value) return "Inget värde";

    switch (field) {
      case "priorityId":
        const priority = priorities.find((p) => p.id.toString() === value);
        return priority ? priority.name : value;

      case "statusId":
        const status = statuses.find((s) => s.id.toString() === value);
        return status ? status.name : value;

      case "deviationTypeId":
        const type = deviationTypes.find((t) => t.id.toString() === value);
        return type ? type.name : value;

      case "assignedToUserId":
        const user = users.find((u) => u.id.toString() === value);
        return user
          ? `${user.firstName} ${user.lastName}`.trim() || user.email
          : value;

      case "workTaskId":
        const workTask = workTasks.find((w) => w.id.toString() === value);
        return workTask ? workTask.name : value;

      case "locationId":
        const workStation = workStations.find((w) => w.id.toString() === value);
        return workStation ? workStation.name : value;

      case "dueDate":
        if (value) {
          try {
            return format(new Date(value), "d MMM yyyy", { locale: sv });
          } catch {
            return value;
          }
        }
        return "Inget datum";

      default:
        return value;
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">Laddar aktivitetslogg...</div>
    );
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
              <p className="text-sm font-medium">
                {translateLogMessage(log.description || log.action)}
              </p>
              <span className="text-xs text-gray-500">
                {format(new Date(log.createdAt), "d MMM yyyy HH:mm", {
                  locale: sv,
                })}
              </span>
            </div>
            <p className="text-xs text-gray-600">av {userName}</p>
            {log.oldValue && log.newValue && (
              <div className="text-xs text-gray-500 mt-1">
                <span className="line-through">
                  {mapFieldValue(log.field || "", log.oldValue)}
                </span>{" "}
                → {mapFieldValue(log.field || "", log.newValue)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DeviationTimeline({ deviationId }: { deviationId: number }) {
  const { t } = useTranslation();
  const { data: logs = [] } = useQuery<DeviationLog[]>({
    queryKey: [`/api/deviations/${deviationId}/logs`],
  });

  const { data: comments = [] } = useQuery<DeviationComment[]>({
    queryKey: [`/api/deviations/${deviationId}/comments`],
  });

  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  const { data: priorities = [] } = useQuery<DeviationPriority[]>({
    queryKey: ["/api/deviations/priorities"],
  });

  const { data: statuses = [] } = useQuery<DeviationStatus[]>({
    queryKey: ["/api/deviations/statuses"],
  });

  const { data: deviationTypes = [] } = useQuery<DeviationType[]>({
    queryKey: ["/api/deviations/types"],
  });

  const { data: workTasks = [] } = useQuery<WorkTask[]>({
    queryKey: ["/api/work-tasks"],
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Function to translate log messages
  const translateLogMessage = (key: string): string => {
    return t(`deviations.logs.${key}`, { defaultValue: key });
  };

  // Function to map ID values to readable names
  const mapFieldValue = (field: string, value: string | undefined): string => {
    if (!value) return "Inget värde";

    switch (field) {
      case "priorityId":
        const priority = priorities.find((p) => p.id.toString() === value);
        return priority ? priority.name : value;
      case "departmentId":
        const department =
          departments && Array.isArray(departments)
            ? departments.find((p) => p.id.toString() === value)
            : null;
        return department ? department.name : value;
      case "statusId":
        const status = statuses.find((s) => s.id.toString() === value);
        return status ? status.name : value;

      case "deviationTypeId":
        const type = deviationTypes.find((t) => t.id.toString() === value);
        return type ? type.name : value;

      case "assignedToUserId":
        const user = users.find((u) => u.id.toString() === value);
        return user
          ? `${user.firstName} ${user.lastName}`.trim() || user.email
          : value;

      case "workTaskId":
        const workTask = workTasks.find((w) => w.id.toString() === value);
        return workTask ? workTask.name : value;

      case "locationId":
        const workStation = workStations.find((w) => w.id.toString() === value);
        return workStation ? workStation.name : value;

      case "dueDate":
        if (value) {
          try {
            return format(new Date(value), "d MMM yyyy", { locale: sv });
          } catch {
            return value;
          }
        }
        return "Inget datum";

      default:
        return value;
    }
  };

  const timeline: TimelineEntry[] = [
    ...logs.map((log) => ({
      id: `log-${log.id}`,
      type: "log",
      createdAt: log.createdAt,
      userId: log.userId,
      content: translateLogMessage(log.description || log.action),
      extra:
        log.oldValue && log.newValue
          ? {
              oldValue: mapFieldValue(log.field || "", log.oldValue),
              newValue: mapFieldValue(log.field || "", log.newValue),
            }
          : undefined,
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      createdAt: comment.createdAt,
      userId: comment.userId,
      content: "Ny kommentar",
      commentText: comment.comment,
    })),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const getIcon = (
    entry: TimelineEntry,
  ): { icon: JSX.Element; color: string } => {
    if (entry.type === "comment") {
      return { icon: <MessageSquare size={16} />, color: "#0ea5e9" };
    }

    // Check for creation action first (before checking for extra fields)
    if (
      entry.content.toLowerCase().includes("skapad") ||
      entry.content === "Avvikelse skapad"
    ) {
      return { icon: <Plus size={16} />, color: "#10b981" };
    }

    if (entry.extra?.oldValue && entry.extra?.newValue) {
      if (entry.content.toLowerCase().includes("status")) {
        return { icon: <CheckCircle size={16} />, color: "#3b82f6" };
      }
      if (entry.content.toLowerCase().includes("prioritet")) {
        return { icon: <AlertTriangle size={16} />, color: "#f97316" };
      }
      if (entry.content.toLowerCase().includes("tilldelning")) {
        return { icon: <User size={16} />, color: "#eab308" };
      }
      if (entry.content.toLowerCase().includes("typ")) {
        return { icon: <Tag size={16} />, color: "#8b5cf6" };
      }
    }
    return { icon: <Edit3 size={16} />, color: "#6b7280" };
  };

  return (
    <VerticalTimeline layout="1-column" lineColor="#e5e7eb">
      {timeline.map((entry) => {
        const user = users.find((u) => u.id === entry.userId);
        const userName = user
          ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email
          : "Okänd användare";

        const { icon, color } = getIcon(entry);

        return (
          <VerticalTimelineElement
            key={entry.id}
            date={format(new Date(entry.createdAt), "d MMM yyyy HH:mm", {
              locale: sv,
            })}
            icon={icon}
            iconStyle={{
              background: color,
              color: "#fff",
            }}
            contentStyle={{ background: "#f9fafb", padding: "0.75rem" }}
            contentArrowStyle={{ display: "none" }}
          >
            <h4 className="text-sm font-medium">{entry.content}</h4>

            {entry.type === "comment" && (entry as any).commentText && (
              <p className="text-sm text-gray-700 mt-1">
                {(entry as any).commentText}
              </p>
            )}

            {entry.extra && (
              <p className="text-xs text-gray-400 mt-1">
                <span className="line-through">{entry.extra.oldValue}</span> →{" "}
                {entry.extra.newValue}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">av {userName}</p>
          </VerticalTimelineElement>
        );
      })}
    </VerticalTimeline>
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
    mutationFn: async (comment: string) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/deviations/${deviationId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
        body: JSON.stringify({ comment }),
      });

      if (!response.ok) {
        throw new Error("Failed to create comment");
      }

      return response.json();
    },
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
  const { user } = useAuth();

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
  // Fetch work departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch custom field values for this deviation
  const { data: customFieldValues = [] } = useQuery<any[]>({
    queryKey: [`/api/deviations/${deviationId}/custom-field-values`],
    enabled: !!deviationId,
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

  const deviationType = deviationTypes.find(
    (t) => t.id === deviation.deviationTypeId,
  );
  const priority = priorities.find((p) => p.id === deviation.priorityId);
  const status = statuses.find((s) => s.id === deviation.statusId);
  const assignedUser = users.find((u) => u.id === deviation.assignedToUserId);
  const createdByUser = users.find((u) => u.id === deviation.createdByUserId);
  const workTask = workTasks.find((w) => w.id === deviation.workTaskId);
  const workStation = workStations.find((w) => w.id === deviation.locationId);
  const assignedDepartment =
    departments && Array.isArray(departments)
      ? departments.find((d) => d.id === deviation.departmentId)
      : null;

  // Check if user can edit this deviation
  const canEdit = () => {
    if (!user) return false;

    // Admin and superadmin can always edit
    if (user.role === "admin" || user.role === "superadmin") {
      return true;
    }

    // Creator can edit their own deviations
    if (deviation.createdByUserId === user.id) {
      return true;
    }

    // Assigned user can edit
    if (deviation.assignedToUserId === user.id) {
      return true;
    }

    // Department responsible can edit deviations in their department
    if (
      assignedDepartment &&
      assignedDepartment.responsibleUserId === user.id
    ) {
      return true;
    }

    return false;
  };

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
              disabled={!canEdit()}
            >
              <Edit className="w-4 h-4 mr-2" />
              Redigera
            </Button>
          </div>
        </div>

        {/* Layout med kolumner och rader */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          <div className="space-y-6 lg:col-span-3">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Grundläggande information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Titel</Label>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    {deviation.title}
                  </p>
                </div>
                {deviation.description && (
                  <div>
                    <Label>Beskrivning</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {deviation.description}
                    </p>
                  </div>
                )}

                {/* Snygg, horisontell metadata-grupp */}
                <div>
                  <Label className="text-sm text-gray-500">Egenskaper</Label>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-800 dark:text-gray-200">
                    {deviationType && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: deviationType.color }}
                        />
                        <span>{deviationType.name}</span>
                      </div>
                    )}

                    {status && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <span>{status.name}</span>
                      </div>
                    )}

                    {priority && (
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: priority.color }}
                        />
                        <span>{priority.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Relaterad info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Avdelning</Label>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">
                      {assignedDepartment?.name || "Ingen avdelning vald"}
                    </p>
                  </div>

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

                {/* Tidslinje */}
                <div className="col-span-2 mt-4 border-t pt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      <strong>Skapad:</strong>{" "}
                      {format(
                        new Date(deviation.createdAt),
                        "d MMM yyyy HH:mm",
                        { locale: sv },
                      )}
                      {createdByUser && (
                        <span className="ml-2 text-xs italic">
                          av{" "}
                          {`${createdByUser.firstName} ${createdByUser.lastName}`.trim() ||
                            createdByUser.email}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-400" />
                    <span>
                      <strong>Senast uppdaterad:</strong>{" "}
                      {format(
                        new Date(deviation.updatedAt),
                        "d MMM yyyy HH:mm",
                        { locale: sv },
                      )}
                    </span>
                  </div>

                  {deviation.dueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        <strong>Deadline:</strong>{" "}
                        {format(
                          new Date(deviation.dueDate),
                          "d MMM yyyy HH:mm",
                          { locale: sv },
                        )}
                      </span>
                    </div>
                  )}

                  {deviation.completedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-gray-400" />
                      <span>
                        <strong>Slutförd:</strong>{" "}
                        {format(
                          new Date(deviation.completedAt),
                          "d MMM yyyy HH:mm",
                          { locale: sv },
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Custom Fields */}
                {customFieldValues.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <Label className="text-sm text-gray-500">Extrafält</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                      {customFieldValues.map((fieldValue: any) => (
                        <div key={fieldValue.id}>
                          <Label className="text-sm font-medium">
                            {fieldValue.field.name}
                            {fieldValue.field.isRequired && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">
                            {fieldValue.field.fieldType === 'checkbox' 
                              ? (fieldValue.value === 'true' ? 'Ja' : 'Nej')
                              : fieldValue.value || 'Inget värde'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachments */}
            <AttachmentList deviationId={deviation.id} canUpload={canEdit()} />

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
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] flex flex-col sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Aktivitetslogg
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto pr-1">
                <DeviationTimeline deviationId={deviation.id} />
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

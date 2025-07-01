// Timeline-komponent för avvikelser
import { useQuery } from "@tanstack/react-query";
import { VerticalTimeline, VerticalTimelineElement } from "react-vertical-timeline-component";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import {
  MessageSquare,
  User,
  CheckCircle,
  Edit3,
  AlertTriangle,
  Tag,
  Plus,
} from "lucide-react";
import "react-vertical-timeline-component/style.min.css";
import { useTranslation } from "react-i18next";

interface TimelineEntry {
  id: string;
  type: "log" | "comment";
  createdAt: string;
  userId: number;
  content: string;
  commentText?: string;
  extra?: { oldValue: string; newValue: string };
}

interface Log {
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

interface Comment {
  id: number;
  deviationId: number;
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

interface DeviationTimelineProps {
  deviationId: number;
}

export default function DeviationTimeline({ deviationId }: DeviationTimelineProps) {
  const { t } = useTranslation();

  const { data: logs = [] } = useQuery<Log[]>({
    queryKey: [`/api/deviations/${deviationId}/logs`],
  });

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: [`/api/deviations/${deviationId}/comments`],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const timeline: TimelineEntry[] = [
    ...logs.map((log) => ({
      id: `log-${log.id}`,
      type: "log",
      createdAt: log.createdAt,
      userId: log.userId,
      content: t(`deviations.logs.${log.description || log.action}`, {
        defaultValue: log.description || log.action,
      }),
      extra:
        log.oldValue && log.newValue
          ? {
              oldValue: log.oldValue,
              newValue: log.newValue,
            }
          : undefined,
    })),
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: "comment",
      createdAt: comment.createdAt,
      userId: comment.userId,
      content: t("deviations.logs.comment_added", { defaultValue: "Ny kommentar" }),
      commentText: comment.comment,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const getIcon = (entry: TimelineEntry) => {
    if (entry.type === "comment") return { icon: <MessageSquare size={16} />, color: "#0ea5e9" };
    if (entry.content.toLowerCase().includes("skapad")) return { icon: <Plus size={16} />, color: "#10b981" };
    if (entry.extra) {
      const content = entry.content.toLowerCase();
      if (content.includes("status")) return { icon: <CheckCircle size={16} />, color: "#3b82f6" };
      if (content.includes("prioritet")) return { icon: <AlertTriangle size={16} />, color: "#f97316" };
      if (content.includes("tilldelning")) return { icon: <User size={16} />, color: "#eab308" };
      if (content.includes("typ")) return { icon: <Tag size={16} />, color: "#8b5cf6" };
    }
    return { icon: <Edit3 size={16} />, color: "#6b7280" };
  };

  return (
    <VerticalTimeline layout="1-column" lineColor="#e5e7eb">
      {timeline.map((entry) => {
        const user = users.find((u) => u.id === entry.userId);
        const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Okänd användare";
        const { icon, color } = getIcon(entry);

        return (
          <VerticalTimelineElement
            key={entry.id}
            date={format(new Date(entry.createdAt), "d MMM yyyy HH:mm", { locale: sv })}
            icon={icon}
            iconStyle={{ background: color, color: "#fff" }}
            contentStyle={{ background: "#f9fafb", padding: "0.75rem" }}
            contentArrowStyle={{ display: "none" }}
          >
            <h4 className="text-sm font-medium text-foreground">{entry.content}</h4>
            {entry.type === "comment" && entry.commentText && (
              <p className="text-sm text-muted-foreground mt-1">{entry.commentText}</p>
            )}
            {entry.extra && (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="line-through">{entry.extra.oldValue}</span> → {entry.extra.newValue}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">av {userName}</p>
          </VerticalTimelineElement>
        );
      })}
    </VerticalTimeline>
  );
}
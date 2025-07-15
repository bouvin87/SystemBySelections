import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Paperclip, 
  Upload, 
  Trash2, 
  Download, 
  Eye, 
  FileImage, 
  FileText, 
  File,
  X 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface KanbanCardAttachment {
  id: string;
  cardId: string;
  userId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  createdAt: string;
  userName: string;
  userEmail: string;
}

interface KanbanCardAttachmentsProps {
  cardId: string;
  currentUserId: number;
}

export function KanbanCardAttachments({ cardId, currentUserId }: KanbanCardAttachmentsProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery<KanbanCardAttachment[]>({
    queryKey: [`/api/kanban/cards/${cardId}/attachments`],
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      setIsUploading(true);
      setUploadProgress(0);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/kanban/cards/${cardId}/attachments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload attachments");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/cards/${cardId}/attachments`] });
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast({
        title: "Bilagor uppladdade",
        description: "Filerna har laddats upp framgångsrikt.",
      });
    },
    onError: (error: any) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Uppladdningsfel",
        description: error.message || "Kunde inte ladda upp filer.",
        variant: "destructive",
      });
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      return apiRequest("DELETE", `/api/kanban/cards/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/kanban/cards/${cardId}/attachments`] });
      toast({
        title: "Bilaga borttagen",
        description: "Filen har tagits bort.",
      });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort filen.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      uploadAttachmentMutation.mutate(files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-4 w-4" />;
    } else if (mimeType === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const getFileName = (filePath: string) => {
    return filePath.split("/").pop() || filePath;
  };

  const handleDownload = (attachment: KanbanCardAttachment) => {
    const fileName = getFileName(attachment.filePath);
    const url = `/api/files/kanban/${fileName}`;
    window.open(url, "_blank");
  };

  const handlePreview = (attachment: KanbanCardAttachment) => {
    if (attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf") {
      const fileName = getFileName(attachment.filePath);
      const url = `/api/files/kanban/${fileName}`;
      window.open(url, "_blank");
    }
  };

  const canPreview = (mimeType: string) => {
    return mimeType.startsWith("image/") || mimeType === "application/pdf";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            Bilagor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laddar bilagor...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Paperclip className="h-4 w-4" />
          Bilagor ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            accept="image/*,.pdf"
            className="hidden"
          />
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Laddar upp filer...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="h-3 w-3 mr-2" />
            {isUploading ? "Laddar upp..." : "Ladda upp filer"}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            Accepterade format: Bilder (JPEG, PNG, GIF, WebP) och PDF-filer
          </div>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 ? (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex-shrink-0">
                  {getFileIcon(attachment.mimeType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate" title={attachment.fileName}>
                      {attachment.fileName}
                    </span>
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {formatFileSize(attachment.fileSize)}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Uppladdad av {attachment.userName} • {format(new Date(attachment.createdAt), "d MMM HH:mm", { locale: sv })}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  {canPreview(attachment.mimeType) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handlePreview(attachment)}
                      title="Förhandsgranska"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => handleDownload(attachment)}
                    title="Ladda ner"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  {attachment.userId === currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                      title="Ta bort"
                      disabled={deleteAttachmentMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4">
            Inga bilagor ännu. Ladda upp filer för att komma igång!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
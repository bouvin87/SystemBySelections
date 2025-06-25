import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  File, 
  Image, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  Paperclip 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "./FileUpload";
import { FilePreviewModal } from "./FilePreviewModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeviationAttachment {
  id: number;
  deviationId: number;
  userId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  createdAt: string;
}

interface DeviationUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
}

interface AttachmentListProps {
  deviationId: number;
  canUpload?: boolean;
}

export function AttachmentList({ deviationId, canUpload = false }: AttachmentListProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [previewFile, setPreviewFile] = useState<DeviationAttachment | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery<DeviationAttachment[]>({
    queryKey: [`/api/deviations/${deviationId}/attachments`],
    enabled: !!deviationId,
  });

  // Fetch users for displaying uploader names
  const { data: users = [] } = useQuery<DeviationUser[]>({
    queryKey: ["/api/users"],
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`/api/deviations/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/deviations/${deviationId}/attachments`],
      });
      toast({
        title: "Bilaga borttagen",
        description: "Filen har tagits bort"
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Fel",
        description: "Kunde inte ta bort filen"
      });
    },
  });

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return "Okänd användare";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email;
  };

  const handleDownload = (attachment: DeviationAttachment) => {
    const filename = attachment.filePath.split('/').pop() || attachment.fileName;
    const url = `/api/files/${filename}`;
    window.open(url, '_blank');
  };

  const handlePreview = (attachment: DeviationAttachment) => {
    setPreviewFile(attachment);
  };

  const getFileUrl = (attachment: DeviationAttachment) => {
    const filename = attachment.filePath.split('/').pop() || attachment.fileName;
    return `/api/files/${filename}`;
  };

  const handleUploadComplete = () => {
    setShowUpload(false);
    queryClient.invalidateQueries({
      queryKey: [`/api/deviations/${deviationId}/attachments`],
    });
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">Laddar bilagor...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Bilagor ({attachments.length})
          </CardTitle>
          {canUpload && (
            <Dialog open={showUpload} onOpenChange={setShowUpload}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Ladda upp filer</DialogTitle>
                </DialogHeader>
                <FileUpload 
                  deviationId={deviationId}
                  onUploadComplete={handleUploadComplete}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Inga bilagor ännu</p>
            {canUpload && (
              <Button 
                variant="outline" 
                onClick={() => setShowUpload(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till första bilagan
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.fileName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <span>{getUserName(attachment.userId)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(attachment.createdAt), "d MMM yyyy HH:mm", { locale: sv })}
                      </span>
                    </div>
                  </div>
                  {attachment.mimeType.startsWith('image/') && (
                    <Badge variant="secondary" className="text-xs">
                      Bild
                    </Badge>
                  )}
                  {attachment.mimeType === 'application/pdf' && (
                    <Badge variant="secondary" className="text-xs">
                      PDF
                    </Badge>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Ladda ner"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  {(attachment.mimeType.startsWith('image/') || attachment.mimeType === 'application/pdf') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(attachment)}
                      title={attachment.mimeType.startsWith('image/') ? "Visa bild" : "Visa PDF"}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}

                  {canUpload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                      disabled={deleteAttachmentMutation.isPending}
                      title="Ta bort"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileName={previewFile.fileName}
          mimeType={previewFile.mimeType}
          fileUrl={getFileUrl(previewFile)}
        />
      )}
    </Card>
  );
}
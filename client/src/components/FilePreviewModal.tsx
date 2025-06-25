import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  mimeType: string;
  fileUrl: string;
}

export function FilePreviewModal({ isOpen, onClose, fileName, mimeType, fileUrl }: FilePreviewModalProps) {
  const isImage = mimeType.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  const handleDownload = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="truncate pr-4">{fileName}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Ladda ner
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-4 flex-1 overflow-auto">
          {isImage && (
            <div className="flex justify-center">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  console.error('Image failed to load:', e);
                }}
              />
            </div>
          )}
          
          {isPdf && (
            <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
              <iframe
                src={fileUrl}
                className="w-full h-full"
                title={fileName}
                onError={(e) => {
                  console.error('PDF failed to load:', e);
                }}
              />
            </div>
          )}
          
          {!isImage && !isPdf && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Förhandsvisning inte tillgänglig för denna filtyp
              </p>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Ladda ner fil
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, File, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  deviationId?: number;
  onUploadComplete?: (files: any[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function FileUpload({ 
  deviationId, 
  onUploadComplete, 
  maxFiles = 5, 
  maxSize = 10 
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png', 
    'image/gif',
    'image/webp',
    'application/pdf'
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file count
    if (selectedFiles.length + files.length > maxFiles) {
      toast({
        variant: "destructive",
        title: "För många filer",
        description: `Maximalt ${maxFiles} filer tillåtna`
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Ogiltigt filformat",
          description: `${file.name} har ett ogiltigt format. Endast bilder och PDF-filer tillåtna.`
        });
        return false;
      }
      
      if (file.size > maxSize * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Fil för stor",
          description: `${file.name} är större än ${maxSize}MB`
        });
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!deviationId || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/deviations/${deviationId}/attachments`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploadedFiles = await response.json();
      
      toast({
        title: "Filer uppladdade",
        description: `${selectedFiles.length} fil(er) har laddats upp`
      });

      setSelectedFiles([]);
      setUploadProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Uppladdning misslyckades",
        description: "Kunde inte ladda upp filerna"
      });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* File selection */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Dra och släpp filer här eller klicka för att välja
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Bilder (JPEG, PNG, GIF, WebP) och PDF-filer. Max {maxSize}MB per fil.
        </p>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Välj filer
        </Button>
      </div>

      {/* Selected files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Valda filer ({selectedFiles.length}/{maxFiles})</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate max-w-48">{file.name}</span>
                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Laddar upp...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && deviationId && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
        >
          {uploading ? 'Laddar upp...' : `Ladda upp ${selectedFiles.length} fil(er)`}
        </Button>
      )}
    </div>
  );
}
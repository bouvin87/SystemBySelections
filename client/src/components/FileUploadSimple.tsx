import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, File, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FileUploadSimpleProps {
  selectedFiles: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
}

export function FileUploadSimple({ 
  selectedFiles,
  onFilesChange,
  maxFiles = 5, 
  maxSize = 10 
}: FileUploadSimpleProps) {
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

    onFilesChange([...selectedFiles, ...validFiles]);
  };

  const removeFile = (index: number) => {
    onFilesChange(selectedFiles.filter((_, i) => i !== index));
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
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Välj filer att bifoga
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Bilder och PDF-filer. Max {maxSize}MB per fil.
        </p>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          size="sm"
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
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
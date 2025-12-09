import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventoLogoUploadAreaProps {
  existingLogoUrl: string | null;
  newLogoPreview: string | null;
  newLogoFile: File | null;
  onLogoChange: (file: File | null, preview: string | null) => void;
  onLogoRemove: () => void;
}

export function EventoLogoUploadArea({
  existingLogoUrl,
  newLogoPreview,
  newLogoFile,
  onLogoChange,
  onLogoRemove,
}: EventoLogoUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      onLogoChange(file, preview);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = newLogoPreview || existingLogoUrl;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Logomarca do Evento (Banner 600x100)</label>
      
      {displayUrl ? (
        <div className="relative border-2 border-dashed rounded-lg p-4 bg-muted/30">
          <div className="flex items-center justify-center">
            <img
              src={displayUrl}
              alt="Logo do evento"
              className="max-h-24 max-w-full object-contain rounded"
            />
          </div>
          <div className="flex justify-center gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Alterar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLogoRemove}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center gap-2">
            <ImageIcon className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Arraste uma imagem ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">
                Recomendado: 600x100 pixels (banner horizontal)
              </p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Imagem
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Check, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LogoUploadAreaProps {
  existingLogoUrl?: string | null;
  existingLogoDate?: string | null;
  newLogoPreview?: string | null;
  newLogoFile?: File | null;
  onLogoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoRemove: () => void;
}

export function LogoUploadArea({
  existingLogoUrl,
  existingLogoDate,
  newLogoPreview,
  newLogoFile,
  onLogoChange,
  onLogoRemove,
}: LogoUploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        // Create a synthetic event to reuse the onLogoChange handler
        const syntheticEvent = {
          target: { files: [file] }
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        onLogoChange(syntheticEvent);
      }
    }
  };

  // Estado 3: Nova logo selecionada
  if (newLogoPreview && newLogoFile) {
    return (
      <div className="space-y-4">
        <div className="relative border-2 border-primary rounded-lg p-4 bg-primary/5">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <img
                src={newLogoPreview}
                alt="Nova logo"
                className="w-32 h-32 object-contain rounded-lg border border-border bg-background"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm truncate">{newLogoFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(newLogoFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onLogoRemove}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado 2: Logo existente salva
  if (existingLogoUrl) {
    return (
      <div className="space-y-4">
        <div className="relative border-2 border-green-500/30 rounded-lg p-6 bg-green-500/5">
          <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Logo Salva
          </Badge>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={existingLogoUrl}
                alt="Logo da entidade"
                className="w-48 h-48 object-contain rounded-lg border-2 border-green-500/20 bg-background"
              />
            </div>
            
            {existingLogoDate && (
              <p className="text-sm text-muted-foreground">
                Atualizada em: {format(new Date(existingLogoDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('logo-input')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Alterar Logo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onLogoRemove}
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          </div>
        </div>
        
        <input
          id="logo-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={onLogoChange}
          className="hidden"
        />
      </div>
    );
  }

  // Estado 1: Sem logo (inicial)
  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div>
          <p className="font-medium">Adicionar Logomarca</p>
          <p className="text-sm text-muted-foreground mt-1">
            PNG, JPG, WEBP ou SVG (máx. 2MB)
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dimensões recomendadas: 500x500px
          </p>
        </div>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('logo-input')?.click()}
        >
          <Upload className="h-4 w-4 mr-2" />
          Selecionar Arquivo
        </Button>
        
        <input
          id="logo-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
          onChange={onLogoChange}
          className="hidden"
        />
      </div>
    </div>
  );
}

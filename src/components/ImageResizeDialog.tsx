import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import { formatFileSize, getImageDimensions } from "@/lib/image-utils";

interface ImageResizeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onResize: () => void;
  onChooseAnother: () => void;
}

export function ImageResizeDialog({
  open,
  onOpenChange,
  file,
  onResize,
  onChooseAnother,
}: ImageResizeDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (file) {
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Obter dimensões
      getImageDimensions(file).then(setDimensions).catch(console.error);
    } else {
      setPreview(null);
      setDimensions(null);
    }
  }, [file]);

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Imagem Muito Grande</DialogTitle>
          </div>
          <DialogDescription className="space-y-2 pt-2">
            <p>A imagem selecionada tem <strong>{formatFileSize(file.size)}</strong></p>
            <p className="text-destructive">Tamanho máximo: 2 MB</p>
            {dimensions && (
              <>
                <p className="mt-3">Dimensões: <strong>{dimensions.width}x{dimensions.height}px</strong></p>
                <p className="text-muted-foreground">Recomendado: até 1000x1000px</p>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {preview && (
          <div className="flex justify-center py-4">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 object-contain rounded-lg border border-border"
            />
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={onResize}
            className="w-full"
            size="lg"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Redimensionar Automaticamente
            <span className="ml-2 text-xs opacity-75">(1000x1000px)</span>
          </Button>

          <Button
            onClick={onChooseAnother}
            variant="outline"
            className="w-full"
          >
            Escolher Outra Imagem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

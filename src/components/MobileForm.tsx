
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFormProps {
  title: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileForm({ title, onBack, children, footer, className }: MobileFormProps) {
  return (
    <div className={cn("w-full max-w-none", className)}>
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="px-4 pb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onBack}
                className="h-10 w-10 shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Voltar</span>
              </Button>
            )}
            <CardTitle className="text-xl font-semibold truncate">
              {title}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <div className="space-y-6">
            {children}
          </div>
          
          {footer && (
            <div className="mt-8 pt-4 border-t">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function MobileFormField({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
}

export function MobileFormActions({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {children}
    </div>
  );
}

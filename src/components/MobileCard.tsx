
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface MobileCardProps {
  title: string;
  subtitle?: string;
  status?: {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
  fields: Array<{
    label: string;
    value: string | React.ReactNode;
  }>;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline";
  }>;
  onCardClick?: () => void;
}

export function MobileCard({ 
  title, 
  subtitle, 
  status, 
  fields, 
  actions, 
  onCardClick 
}: MobileCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div 
              className="flex-1 min-w-0 cursor-pointer" 
              onClick={onCardClick}
            >
              <h3 className="font-semibold text-base leading-6 truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              {status && (
                <Badge variant={status.variant || "default"} className="text-xs">
                  {status.label}
                </Badge>
              )}
              
              {actions && actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        className="cursor-pointer"
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {field.label}
                </span>
                <div className="text-sm">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

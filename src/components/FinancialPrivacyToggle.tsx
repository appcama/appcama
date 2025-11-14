import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFinancialPrivacy } from '@/hooks/useFinancialPrivacy';

export function FinancialPrivacyToggle() {
  const { showFinancialValues, toggleFinancialValues } = useFinancialPrivacy();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFinancialValues}
            className="h-8 w-8"
          >
            {showFinancialValues ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {showFinancialValues 
            ? 'Ocultar valores financeiros' 
            : 'Mostrar valores financeiros'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

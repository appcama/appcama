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
            variant="outline"
            onClick={toggleFinancialValues}
            className="flex items-center gap-2"
          >
            {showFinancialValues ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Ocultar Valores</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Mostrar Valores</span>
              </>
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

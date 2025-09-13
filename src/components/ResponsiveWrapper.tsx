import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveWrapper({ children, className }: ResponsiveWrapperProps) {
  return (
    <div className={cn(
      // Base responsive container
      "w-full max-w-full mx-auto",
      // Mobile optimizations
      "min-h-screen safe-area-inset touch-manipulation",
      // Prevent horizontal scrolling
      "overflow-x-hidden",
      // Better mobile scrolling
      "overscroll-behavior-y-contain",
      className
    )}>
      {children}
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Recycle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";

interface MobileHeaderProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  allowedFeatures: string[];
  userName?: string;
}

export function MobileHeader({ activeItem, onItemClick, allowedFeatures, userName }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (item: string) => {
    onItemClick(item);
    setIsOpen(false); // Fecha o menu automaticamente
  };

  const handleMenuClose = () => {
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex h-full flex-col">
              <div className="flex h-14 items-center border-b px-4">
                <div className="flex items-center justify-center w-full">
                  <div className="flex items-center justify-center">
                    <img 
                      src="/logo-original.png" 
                      alt="ReciclaÊ Logo" 
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  activeItem={activeItem}
                  onItemClick={handleItemClick}
                  allowedFeatures={allowedFeatures}
                  onMenuClose={handleMenuClose}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-center">
          <div className="flex items-center justify-center">
            <img 
              src="/logo-original.png" 
              alt="ReciclaÊ Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>

        <div className="w-11" /> {/* Spacer para centralizar o logo */}
      </div>
    </header>
  );
}

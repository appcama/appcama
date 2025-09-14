import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Download, Smartphone, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed', platform: string}>;
}

export function PWAPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if running on iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if already in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsInStandaloneMode(inStandalone);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed && !inStandalone) {
        setShowPrompt(true);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setShowPrompt(false);
      setDeferredPrompt(null);
      toast({
        title: "App Instalado!",
        description: "ReciclaÊ foi instalado com sucesso em seu dispositivo.",
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show prompt for iOS users after a delay if not in standalone
    if (iOS && !inStandalone) {
      const dismissed = localStorage.getItem('pwa-ios-prompt-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          toast({
            title: "Instalando...",
            description: "ReciclaÊ está sendo instalado em seu dispositivo.",
          });
        } else {
          console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error showing install prompt:', error);
        toast({
          title: "Erro",
          description: "Não foi possível instalar o app. Tente novamente.",
          variant: "destructive",
        });
      }
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const key = isIOS ? 'pwa-ios-prompt-dismissed' : 'pwa-prompt-dismissed';
    localStorage.setItem(key, 'true');
  };

  if (isInStandaloneMode || !showPrompt) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <Card className="border-primary shadow-lg animate-in slide-in-from-bottom-2 duration-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <img 
                  src="/icon-192x192.png" 
                  alt="ReciclaÊ" 
                  className="w-8 h-8 rounded-lg"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1">Instalar ReciclaÊ</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Instale o app para acesso rápido e funcionalidade offline completa.
                </p>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleInstallClick}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {isIOS ? 'Como Instalar' : 'Instalar'}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleDismiss}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-sm w-full">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <img 
                    src="/icon-192x192.png" 
                    alt="ReciclaÊ" 
                    className="w-12 h-12 rounded-lg"
                  />
                </div>
                <h2 className="text-lg font-semibold mb-2">Instalar ReciclaÊ no iOS</h2>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                  <p>Toque no botão <strong>Compartilhar</strong> <Share className="inline w-4 h-4" /> na parte inferior da tela</p>
                </div>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                  <p>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></p>
                </div>
                
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                  <p>Toque em <strong>"Adicionar"</strong> para confirmar</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setShowIOSInstructions(false)}
                >
                  Entendi
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    setShowIOSInstructions(false);
                    handleDismiss();
                  }}
                >
                  Não mostrar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
// PWA Configuration and Utilities

export const PWA_CONFIG = {
  APP_NAME: 'ReciclaÊ',
  APP_SHORT_NAME: 'ReciclaÊ',
  APP_DESCRIPTION: 'Sistema completo para gestão de reciclagem com funcionalidade offline',
  THEME_COLOR: '#7CB342',
  BACKGROUND_COLOR: '#ffffff',
  DISPLAY: 'standalone',
  START_URL: '/',
  SCOPE: '/',
  ORIENTATION: 'portrait-primary',
  LANG: 'pt-BR'
} as const;

// PWA Detection utilities
export const PWAUtils = {
  // Check if app is running in PWA mode
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  },

  // Check if device is iOS
  isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // Check if device is Android
  isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  },

  // Check if browser supports PWA installation
  supportsPWAInstall(): boolean {
    return 'serviceWorker' in navigator && 'beforeinstallprompt' in window;
  },

  // Get device type
  getDeviceType(): 'ios' | 'android' | 'desktop' | 'unknown' {
    if (this.isIOS()) return 'ios';
    if (this.isAndroid()) return 'android';
    if (window.innerWidth >= 1024) return 'desktop';
    return 'unknown';
  },

  // Check network status
  isOnline(): boolean {
    return navigator.onLine;
  },

  // Get screen size category
  getScreenSize(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  },

  // Local storage helpers for PWA preferences
  storage: {
    getPWAPromptDismissed(): boolean {
      return localStorage.getItem('pwa-prompt-dismissed') === 'true';
    },

    setPWAPromptDismissed(dismissed: boolean): void {
      localStorage.setItem('pwa-prompt-dismissed', dismissed.toString());
    },

    getIOSPromptDismissed(): boolean {
      return localStorage.getItem('pwa-ios-prompt-dismissed') === 'true';
    },

    setIOSPromptDismissed(dismissed: boolean): void {
      localStorage.setItem('pwa-ios-prompt-dismissed', dismissed.toString());
    },

    getLastSyncTime(): Date | null {
      const timestamp = localStorage.getItem('pwa-last-sync');
      return timestamp ? new Date(parseInt(timestamp)) : null;
    },

    setLastSyncTime(date: Date): void {
      localStorage.setItem('pwa-last-sync', date.getTime().toString());
    }
  }
};

// PWA Installation prompts
export const PWAPrompts = {
  // Get appropriate installation instructions based on device
  getInstallInstructions(deviceType: ReturnType<typeof PWAUtils.getDeviceType>): string[] {
    switch (deviceType) {
      case 'ios':
        return [
          'Toque no botão "Compartilhar" na parte inferior da tela',
          'Role para baixo e toque em "Adicionar à Tela de Início"',
          'Toque em "Adicionar" para confirmar a instalação'
        ];
      
      case 'android':
        return [
          'Toque no menu (três pontos) do seu navegador',
          'Selecione "Instalar app" ou "Adicionar à tela inicial"',
          'Confirme a instalação quando solicitado'
        ];
      
      case 'desktop':
        return [
          'Clique no ícone de instalação na barra de endereço',
          'Ou acesse o menu do navegador e selecione "Instalar ReciclaÊ"',
          'Siga as instruções para completar a instalação'
        ];
      
      default:
        return [
          'Procure pela opção "Instalar app" ou "Adicionar à tela inicial" no menu do seu navegador',
          'Siga as instruções exibidas para instalar o aplicativo'
        ];
    }
  },

  // Get browser-specific installation message
  getBrowserMessage(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Use o Chrome para a melhor experiência de instalação PWA';
    } else if (userAgent.includes('firefox')) {
      return 'Firefox suporta PWAs - procure pela opção de instalação no menu';
    } else if (userAgent.includes('safari')) {
      return 'Use o botão "Compartilhar" para adicionar à tela inicial';
    } else if (userAgent.includes('edge')) {
      return 'Edge suporta instalação de PWAs através do menu de aplicativos';
    }
    
    return 'Procure pela opção de instalação no menu do seu navegador';
  }
};

// Performance optimizations for PWA
export const PWAOptimizations = {
  // Preload critical resources
  preloadCriticalResources(): void {
    const criticalResources = [
      '/manifest.json',
      '/icon-192x192.png',
      '/icon-512x512.png'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.endsWith('.png') ? 'image' : 'fetch';
      document.head.appendChild(link);
    });
  },

  // Optimize images for different screen densities
  getOptimizedIconSize(): string {
    const pixelRatio = window.devicePixelRatio || 1;
    
    if (pixelRatio >= 3) return '/icon-512x512.png';
    if (pixelRatio >= 2) return '/icon-192x192.png';
    return '/icon-192x192.png';
  },

  // Setup viewport meta tag for PWA
  setupViewport(): void {
    let viewportMeta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement;
    
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes, viewport-fit=cover';
  }
};
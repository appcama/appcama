// Singleton para garantir carregamento único da Google Maps API
class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {}

  public static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  public async load(): Promise<void> {
    // Se já carregou, retorna imediatamente
    if (this.isLoaded && window.google?.maps) {
      return Promise.resolve();
    }

    // Se já está carregando, retorna a promise existente
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Iniciar novo carregamento
    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC-SMESmT8ScecSuCz1oTcMFSp7Gg-Leag&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Aguardar Google Maps estar completamente pronto
        if (window.google?.maps) {
          this.isLoaded = true;
          resolve();
        } else {
          reject(new Error('Google Maps não inicializou corretamente'));
        }
      };

      script.onerror = () => {
        reject(new Error('Falha ao carregar Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  public isReady(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();

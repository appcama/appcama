/**
 * Gerenciador global para carregamento do Google Maps API
 * Evita múltiplos carregamentos e melhora a performance
 */

const GOOGLE_MAPS_API_KEY = 'AIzaSyC-SMESmT8ScecSuCz1oTcMFSp7Gg-Leag';
const GOOGLE_MAPS_LIBRARIES = 'places';

interface LoadGoogleMapsOptions {
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

class GoogleMapsLoader {
  private isLoading = false;
  private isLoaded = false;
  private callbacks: Array<() => void> = [];
  private errorCallbacks: Array<(error: Error) => void> = [];

  /**
   * Carrega a API do Google Maps de forma otimizada
   * - Usa cache para evitar múltiplos carregamentos
   * - Usa fila de callbacks para notificar múltiplos componentes
   * - Usa loading=async para melhor performance
   */
  load(options?: LoadGoogleMapsOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Se já está carregado, resolve imediatamente
      if (this.isLoaded && window.google?.maps) {
        options?.onLoad?.();
        resolve();
        return;
      }

      // Adiciona callbacks à fila
      if (options?.onLoad) {
        this.callbacks.push(options.onLoad);
      }
      if (options?.onError) {
        this.errorCallbacks.push(options.onError);
      }

      // Adiciona callbacks de promise
      this.callbacks.push(resolve);
      this.errorCallbacks.push(reject);

      // Se já está carregando, apenas aguarda
      if (this.isLoading) {
        return;
      }

      // Verifica se já foi carregado por outro meio
      if (window.google?.maps) {
        this.onLoadSuccess();
        return;
      }

      // Inicia o carregamento
      this.isLoading = true;

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${GOOGLE_MAPS_LIBRARIES}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => this.onLoadSuccess();
      script.onerror = () => this.onLoadError(new Error('Falha ao carregar Google Maps API'));
      
      document.head.appendChild(script);
    });
  }

  /**
   * Verifica se a API já está carregada
   */
  isReady(): boolean {
    return this.isLoaded && !!window.google?.maps;
  }

  /**
   * Retorna a instância do google.maps
   */
  getMapsApi(): typeof google.maps | null {
    return window.google?.maps || null;
  }

  private onLoadSuccess() {
    this.isLoaded = true;
    this.isLoading = false;

    // Executa todos os callbacks de sucesso
    this.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Erro ao executar callback do Google Maps:', error);
      }
    });

    // Limpa as filas
    this.callbacks = [];
    this.errorCallbacks = [];
  }

  private onLoadError(error: Error) {
    this.isLoading = false;

    // Executa todos os callbacks de erro
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Erro ao executar callback de erro do Google Maps:', err);
      }
    });

    // Limpa as filas
    this.callbacks = [];
    this.errorCallbacks = [];
  }
}

// Exporta instância única (singleton)
export const googleMapsLoader = new GoogleMapsLoader();

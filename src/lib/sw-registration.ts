// Service Worker Registration with Auto-Update
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration.scope);
          
          // Check for updates every 30 minutes
          setInterval(() => {
            console.log('[SW] Verificando atualizações...');
            registration.update();
          }, 30 * 60 * 1000);

          // Check for updates on registration
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('[SW] Nova versão encontrada, instalando...');
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] Nova versão instalada, aplicando atualização...');
                  
                  // Notificar o novo service worker para assumir controle
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  
                  // Mostrar mensagem ao usuário (opcional)
                  if (window.confirm('Nova versão disponível! Recarregar página para atualizar?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });

          // Recarregar quando novo SW assumir controle
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[SW] Novo Service Worker assumiu controle, recarregando...');
            window.location.reload();
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data);
        
        if (event.data && event.data.type === 'BACKGROUND_SYNC') {
          // Trigger sync when background sync is available
          window.dispatchEvent(new CustomEvent('sw-background-sync'));
        }
      });
    });
  } else {
    console.log('[SW] Service Workers not supported');
  }
}

// Register for background sync when online
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      // @ts-ignore - sync API exists in modern browsers
      return registration.sync?.register('background-sync');
    }).catch((error) => {
      console.error('[SW] Background sync registration failed:', error);
    });
  }
}
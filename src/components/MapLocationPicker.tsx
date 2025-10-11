import { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface MapLocationPickerProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number; // Altura do mapa em pixels (opcional)
}

export function MapLocationPicker({ 
  address, 
  latitude, 
  longitude, 
  onLocationChange,
  height = 320,
}: MapLocationPickerProps) {
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const { toast } = useToast();

  // Carregar Google Maps API
  useEffect(() => {
    const apiKey = 'AIzaSyC-SMESmT8ScecSuCz1oTcMFSp7Gg-Leag';
    
    // Verificar se já foi carregado
    if ((window as any).google && (window as any).google.maps) {
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoading(false);
    script.onerror = () => {
      setLoading(false);
      toast({
        title: "Erro ao carregar mapa",
        description: "Não foi possível carregar o Google Maps. Verifique sua chave de API.",
        variant: "destructive",
      });
    };
    
    document.head.appendChild(script);

    return () => {
      // Cleanup se necessário
    };
  }, [toast]);

  // Inicializar mapa
  useEffect(() => {
    if (loading || !(window as any).google || map) return;

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    const googleMaps = (window as any).google.maps;

    // Posição padrão (Salvador, BA)
    const defaultPosition = { lat: -12.9714, lng: -38.5014 };
    const initialPosition = latitude && longitude 
      ? { lat: latitude, lng: longitude }
      : defaultPosition;

    // Adicionar um pequeno delay para garantir que o elemento está pronto
    setTimeout(() => {
      const newMap = new googleMaps.Map(mapElement, {
        center: initialPosition,
        zoom: latitude && longitude ? 15 : 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(newMap);

      // Criar marcador
      const newMarker = new googleMaps.Marker({
        position: initialPosition,
        map: newMap,
        draggable: true,
        title: 'Localização da Entidade',
      });

      setMarker(newMarker);

      // Evento de arrastar marcador
      newMarker.addListener('dragend', () => {
        const position = newMarker.getPosition();
        if (position) {
          onLocationChange(position.lat(), position.lng());
        }
      });

      // Se já tiver coordenadas, notificar
      if (latitude && longitude) {
        onLocationChange(latitude, longitude);
      }
    }, 100);
  }, [loading, latitude, longitude, map, onLocationChange]);

  // Geocodificar endereço
  const geocodeAddress = useCallback(() => {
    if (!address || !map || !marker) {
      toast({
        title: "Endereço incompleto",
        description: "Preencha o endereço completo antes de localizar",
        variant: "destructive",
      });
      return;
    }

    setGeocoding(true);

    const googleMaps = (window as any).google.maps;
    const geocoder = new googleMaps.Geocoder();
    
    geocoder.geocode(
      { address: `${address}, Salvador, Bahia, Brasil` },
      (results: any, status: any) => {
        setGeocoding(false);

        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();

          // Atualizar mapa e marcador
          map.setCenter(location);
          map.setZoom(15);
          marker.setPosition(location);

          // Notificar mudança
          onLocationChange(lat, lng);

          toast({
            title: "Localização encontrada",
            description: "O marcador foi posicionado no endereço. Você pode ajustá-lo arrastando.",
          });
        } else {
          toast({
            title: "Endereço não encontrado",
            description: "Não foi possível localizar o endereço. Posicione o marcador manualmente.",
            variant: "destructive",
          });
        }
      }
    );
  }, [address, map, marker, onLocationChange, toast]);

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Localização no Mapa</h3>
          <p className="text-xs text-muted-foreground">
            {latitude && longitude 
              ? `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
              : 'Nenhuma localização definida'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={geocodeAddress}
          disabled={geocoding || !address}
        >
          {geocoding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Localizando...
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Localizar Endereço
            </>
          )}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div 
          id="map" 
          style={{ height: `${height}px`, width: '100%' }}
          className="bg-muted"
        />
      </Card>

      <p className="text-xs text-muted-foreground">
        💡 Dica: Você pode arrastar o marcador para ajustar a posição exata
      </p>
    </div>
  );
}

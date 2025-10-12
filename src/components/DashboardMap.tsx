import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardMapData } from "@/hooks/useDashboardMapData";
import { Loader2 } from "lucide-react";

interface DashboardMapProps {
  startDate?: string;
  endDate?: string;
  entityId?: number;
}

export const DashboardMap = ({ startDate, endDate, entityId }: DashboardMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data, isLoading, error } = useDashboardMapData({ startDate, endDate, entityId });

  // Carregar Google Maps API
  useEffect(() => {
    if (window.google?.maps) {
      setIsMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyC-SMESmT8ScecSuCz1oTcMFSp7Gg-Leag&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!isMapLoaded || !mapContainer.current || mapInstance.current) return;

    mapInstance.current = new google.maps.Map(mapContainer.current, {
      center: { lat: -12.9714, lng: -38.5014 }, // Salvador, BA
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    infoWindowRef.current = new google.maps.InfoWindow();

    // Aguardar o mapa estar completamente carregado
    google.maps.event.addListenerOnce(mapInstance.current, 'tilesloaded', () => {
      setIsMapReady(true);
    });
  }, [isMapLoaded]);

  // Atualizar marcadores quando os dados mudarem
  useEffect(() => {
    if (!mapInstance.current || !data || !isMapReady) return;

    // Limpar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Adicionar marcadores de entidades
    data.entidades.forEach((entidade) => {
      const position = { lat: entidade.latitude, lng: entidade.longitude };
      
      const marker = new google.maps.Marker({
        position,
        map: mapInstance.current,
        title: entidade.nome,
        icon: {
          url: entidade.isColetora 
            ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
        }
      });

      const contentString = `
        <div style="padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-weight: bold;">${entidade.nome}</h3>
          <p style="margin: 5px 0;"><strong>Tipo:</strong> ${entidade.tipo}</p>
          <p style="margin: 5px 0;"><strong>Endereço:</strong><br/>${entidade.endereco}</p>
          ${entidade.telefone ? `<p style="margin: 5px 0;"><strong>Telefone:</strong> ${entidade.telefone}</p>` : ''}
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasMarkers = true;
    });

    // Adicionar marcadores de pontos de coleta
    data.pontosColeta.forEach((ponto) => {
      const position = { lat: ponto.latitude, lng: ponto.longitude };
      
      const marker = new google.maps.Marker({
        position,
        map: mapInstance.current,
        title: ponto.nome,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
      });

      const contentString = `
        <div style="padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #059669; font-weight: bold;">${ponto.nome}</h3>
          <p style="margin: 5px 0;"><strong>Tipo:</strong> ${ponto.tipo}</p>
          <p style="margin: 5px 0;"><strong>Endereço:</strong><br/>${ponto.endereco}</p>
        </div>
      `;

      marker.addListener('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(mapInstance.current, marker);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
      hasMarkers = true;
    });

    // Ajustar zoom e centralização para mostrar todos os marcadores
    if (hasMarkers && mapInstance.current) {
      mapInstance.current.fitBounds(bounds);
      
      // Limitar zoom máximo
      const listener = google.maps.event.addListener(mapInstance.current, "idle", () => {
        if (mapInstance.current && mapInstance.current.getZoom()! > 16) {
          mapInstance.current.setZoom(16);
        }
        google.maps.event.removeListener(listener);
      });
    }
  }, [data, isMapReady]);

  if (isLoading || !isMapReady) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Localização dos Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Localização dos Pontos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Erro ao carregar o mapa
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPontos = (data?.entidades.length || 0) + (data?.pontosColeta.length || 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Localização dos Pontos</CardTitle>
      </CardHeader>
      <CardContent>
        {totalPontos === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Nenhum ponto com localização cadastrada
          </div>
        ) : (
          <div className="relative">
            <div 
              ref={mapContainer} 
              className="w-full h-[400px] rounded-lg"
            />
            
            {/* Legenda */}
            <div className="absolute top-3 right-3 bg-card border border-border rounded-lg p-3 shadow-lg">
              <div className="text-sm font-semibold mb-2">Legenda</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Entidades Coletoras</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span>Entidades Geradoras</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Pontos de Coleta</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { MapMarker } from "@/hooks/useDashboardMapData";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Building2, Recycle } from "lucide-react";

interface DashboardMapProps {
  markers: MapMarker[];
}

export function DashboardMap({ markers }: DashboardMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        setIsLoading(false);
        return;
      }

      try {
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBWNR-HLg4Yjf5vUx6-Kc-f2bPKPlrB-go';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => setIsLoading(false);
        script.onerror = () => {
          setLoadError(true);
          setIsLoading(false);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        setLoadError(true);
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || !window.google?.maps || isLoading) return;

    if (!mapRef.current) {
      // Default center: Salvador, Bahia
      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: { lat: -12.9714, lng: -38.5014 },
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });
    }
  }, [isLoading]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps || markers.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();

    markers.forEach((markerData) => {
      const position = {
        lat: markerData.latitude,
        lng: markerData.longitude
      };

      // Determine marker color based on type
      let markerColor = '#10b981'; // Green for ponto_coleta
      if (markerData.type === 'entidade') {
        markerColor = markerData.isCollector ? '#3b82f6' : '#f97316'; // Blue for collector, orange for generator
      }

      const marker = new google.maps.Marker({
        position,
        map: mapRef.current,
        title: markerData.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 8,
        }
      });

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; color: #1f2937;">${markerData.name}</h3>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
              <strong>Tipo:</strong> ${markerData.subtype}
            </p>
            <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">
              <strong>Endereço:</strong> ${markerData.address}
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(mapRef.current, marker);
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (markers.length > 0) {
      mapRef.current.fitBounds(bounds);
      
      // Prevent over-zooming for single marker
      if (markers.length === 1) {
        const listener = google.maps.event.addListener(mapRef.current, "idle", () => {
          if (mapRef.current!.getZoom()! > 15) {
            mapRef.current!.setZoom(15);
          }
          google.maps.event.removeListener(listener);
        });
      }
    }
  }, [markers]);

  if (loadError) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Erro ao carregar o mapa. Verifique sua conexão com a internet.
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-[500px] w-full" />;
  }

  const pontosCount = markers.filter(m => m.type === 'ponto_coleta').length;
  const coletoresCount = markers.filter(m => m.type === 'entidade' && m.isCollector).length;
  const geradoresCount = markers.filter(m => m.type === 'entidade' && !m.isCollector).length;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Mapa de Pontos de Coleta e Entidades
          </h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-muted-foreground">
                <Recycle className="inline h-4 w-4 mr-1" />
                Pontos de Coleta ({pontosCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">
                <Building2 className="inline h-4 w-4 mr-1" />
                Coletoras ({coletoresCount})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">
                <Building2 className="inline h-4 w-4 mr-1" />
                Geradoras ({geradoresCount})
              </span>
            </div>
          </div>
        </div>
      </div>
      <div ref={mapContainerRef} className="h-[500px] w-full" />
    </Card>
  );
}

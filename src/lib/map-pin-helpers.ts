/**
 * Helper para criar pins personalizados do Google Maps
 * Usa AdvancedMarkerElement e PinElement para melhor performance
 */

export interface PinConfig {
  background: string;
  borderColor: string;
  glyphColor: string;
}

export const PIN_COLORS = {
  coletora: {
    background: '#1e40af', // blue-800
    borderColor: '#1e3a8a', // blue-900
    glyphColor: '#ffffff'
  },
  geradora: {
    background: '#ea580c', // orange-600
    borderColor: '#c2410c', // orange-700
    glyphColor: '#ffffff'
  },
  pontoColeta: {
    background: '#059669', // emerald-600
    borderColor: '#047857', // emerald-700
    glyphColor: '#ffffff'
  }
} as const;

/**
 * Cria um PinElement com cores personalizadas
 */
export function createColoredPin(type: keyof typeof PIN_COLORS): google.maps.marker.PinElement {
  const config = PIN_COLORS[type];
  
  return new google.maps.marker.PinElement({
    background: config.background,
    borderColor: config.borderColor,
    glyphColor: config.glyphColor,
    scale: 1.2
  });
}

/**
 * Cria um AdvancedMarkerElement com pin colorido
 */
export function createAdvancedMarker(
  position: google.maps.LatLngLiteral,
  map: google.maps.Map,
  title: string,
  pinType: keyof typeof PIN_COLORS
): google.maps.marker.AdvancedMarkerElement {
  const pinElement = createColoredPin(pinType);
  
  return new google.maps.marker.AdvancedMarkerElement({
    position,
    map,
    title,
    content: pinElement.element
  });
}

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { HeatmapPoint } from '../../types';
import { getAqiColor } from '../../utils/aqi';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface PollutionMapProps {
  points: HeatmapPoint[];
  center?: [number, number];
  zoom?: number;
  onZoneClick?: (lat: number, lng: number, aqi: number) => void;
}

function HeatLayer({ points }: { points: HeatmapPoint[] }) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!points.length) return;

    import('leaflet.heat').then(() => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
      const heatData = points.map((p) => [p.lat, p.lng, p.intensity] as [number, number, number]);
      // @ts-expect-error leaflet.heat extends L
      const layer = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 14,
        gradient: {
          0.0: '#22c55e',
          0.3: '#eab308',
          0.5: '#f97316',
          0.7: '#ef4444',
          1.0: '#7c3aed',
        },
      });
      layer.addTo(map);
      heatLayerRef.current = layer;
    });

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [points, map]);

  return null;
}

export default function PollutionMap({ points, center = [28.6139, 77.209], zoom = 11, onZoneClick }: PollutionMapProps) {
  return (
    <div className="h-full min-h-[400px] rounded-xl overflow-hidden">
      <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatLayer points={points} />
        {points.map((point, i) => (
          <CircleMarker
            key={i}
            center={[point.lat, point.lng]}
            radius={10}
            pathOptions={{
              color: getAqiColor(point.aqi),
              fillColor: getAqiColor(point.aqi),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onZoneClick?.(point.lat, point.lng, point.aqi),
            }}
          >
            <Popup>
              <div className="text-center">
                <p className="font-bold text-lg" style={{ color: getAqiColor(point.aqi) }}>
                  AQI {Math.round(point.aqi)}
                </p>
                <p className="text-xs text-gray-500">
                  {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

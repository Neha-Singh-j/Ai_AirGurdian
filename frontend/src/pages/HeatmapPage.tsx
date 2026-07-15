import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PollutionMap from '../components/map/PollutionMap';
import AQIBadge from '../components/ui/AQIBadge';
import { pollutionApi } from '../services/endpoints';
import type { HeatmapPoint, AQReading } from '../types';
import { getAqiColor } from '../utils/aqi';

export default function HeatmapPage() {
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [readings, setReadings] = useState<AQReading[]>([]);
  const [selectedAqi, setSelectedAqi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([pollutionApi.getHeatmap(), pollutionApi.getReadings()])
      .then(([h, r]) => { setHeatmap(h); setReadings(r); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading heatmap..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold">Pollution Heatmap</h1>
        <p className="text-slate-500 mt-1">Spatial distribution of air quality across the city</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <div className="h-[600px]">
            <PollutionMap
              points={heatmap}
              onZoneClick={(_lat, _lng, aqi) => setSelectedAqi(aqi)}
            />
          </div>
        </div>

        <div className="space-y-4">
          {/* Legend */}
          <div className="card">
            <h3 className="font-semibold mb-3">AQI Legend</h3>
            {[
              { label: 'Good (0-50)', color: '#22c55e' },
              { label: 'Moderate (51-100)', color: '#eab308' },
              { label: 'Unhealthy SG (101-150)', color: '#f97316' },
              { label: 'Unhealthy (151-200)', color: '#ef4444' },
              { label: 'Very Unhealthy (201-300)', color: '#7c3aed' },
              { label: 'Hazardous (300+)', color: '#581c87' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>

          {selectedAqi !== null && (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card text-center">
              <p className="text-sm text-slate-500 mb-2">Selected Zone</p>
              <AQIBadge aqi={selectedAqi} size="lg" showCategory />
            </motion.div>
          )}

          <div className="card">
            <h3 className="font-semibold mb-3">All Zones</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {readings.map((r) => (
                <div key={r.zone_id} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1">{r.zone_name}</span>
                  <span className="font-bold ml-2" style={{ color: getAqiColor(r.aqi) }}>
                    {Math.round(r.aqi)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

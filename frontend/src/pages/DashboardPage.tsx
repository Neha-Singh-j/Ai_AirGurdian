import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, MapPin, Wind } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import AQIBadge from '../components/ui/AQIBadge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import PollutionMap from '../components/map/PollutionMap';
import { pollutionApi } from '../services/endpoints';
import type { AQReading, HeatmapPoint } from '../types';

export default function DashboardPage() {
  const [readings, setReadings] = useState<AQReading[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [readingsData, heatmapData] = await Promise.all([
          pollutionApi.getReadings(),
          pollutionApi.getHeatmap(),
        ]);
        setReadings(readingsData);
        setHeatmap(heatmapData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner text="Loading air quality data..." />;

  const avgAqi = readings.length
    ? Math.round(readings.reduce((s, r) => s + r.aqi, 0) / readings.length)
    : 0;
  const worstZone = readings.reduce((w, r) => (r.aqi > w.aqi ? r : w), readings[0]);
  const unhealthyCount = readings.filter((r) => r.aqi > 150).length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900">City Air Quality Overview</h1>
        <p className="text-slate-500 mt-1">Real-time monitoring across {readings.length} zones in Delhi NCR</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="City Average AQI" value={avgAqi} icon={Activity} aqi={avgAqi} delay={0} />
        <StatCard
          title="Worst Zone"
          value={worstZone?.zone_name || 'N/A'}
          subtitle={`AQI ${Math.round(worstZone?.aqi || 0)}`}
          icon={AlertTriangle}
          aqi={worstZone?.aqi}
          delay={0.1}
        />
        <StatCard
          title="Unhealthy Zones"
          value={unhealthyCount}
          subtitle={`of ${readings.length} monitored`}
          icon={Wind}
          delay={0.2}
        />
        <StatCard title="Active Zones" value={readings.length} subtitle="Live sensors" icon={MapPin} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 card p-0 overflow-hidden"
        >
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Pollution Heatmap</h2>
            <p className="text-sm text-slate-500">Interactive air quality visualization</p>
          </div>
          <div className="h-[400px]">
            <PollutionMap points={heatmap} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h2 className="font-semibold text-slate-900 mb-4">Zone Rankings</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {[...readings]
              .sort((a, b) => b.aqi - a.aqi)
              .map((reading, i) => (
                <motion.div
                  key={reading.zone_id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{reading.zone_name}</p>
                    <p className="text-xs text-slate-400">PM2.5: {reading.pm25} µg/m³</p>
                  </div>
                  <AQIBadge aqi={reading.aqi} size="sm" />
                </motion.div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

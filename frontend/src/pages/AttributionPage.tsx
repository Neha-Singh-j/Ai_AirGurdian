import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { SourceChart } from '../components/charts/Charts';
import { pollutionApi } from '../services/endpoints';
import type { SourceAttribution, Zone } from '../types';

export default function AttributionPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [attribution, setAttribution] = useState<{
    zone_id: string;
    zone_name: string;
    total_aqi: number;
    sources: SourceAttribution[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setSelectedZone(z[0].zone_id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedZone) return;
    pollutionApi.getAttribution(selectedZone).then(setAttribution);
  }, [selectedZone]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold">Pollution Source Attribution</h1>
        <p className="text-slate-500 mt-1">Identify and quantify pollution sources with confidence scores</p>
      </motion.div>

      <div className="card">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Zone</label>
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="input-field max-w-md"
        >
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
          ))}
        </select>
      </div>

      {attribution && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="card">
            <h2 className="font-semibold mb-4">Source Breakdown — {attribution.zone_name}</h2>
            <SourceChart sources={attribution.sources} />
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card">
            <h2 className="font-semibold mb-4">Source Details</h2>
            <div className="space-y-4">
              {attribution.sources.map((source, i) => (
                <motion.div
                  key={source.source}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{source.source}</h3>
                    <span className="text-lg font-bold text-primary-600">{source.percentage}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{source.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${source.percentage}%` }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                        className="h-full bg-primary-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-slate-400">
                      {(source.confidence * 100).toFixed(0)}% conf.
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

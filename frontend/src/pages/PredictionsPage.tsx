import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AQIBadge from '../components/ui/AQIBadge';
import { PredictionChart } from '../components/charts/Charts';
import { pollutionApi } from '../services/endpoints';
import type { PredictionResponse, Zone } from '../types';
import { getAqiColor } from '../utils/aqi';

export default function PredictionsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setSelectedZone(z[0].zone_id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedZone) return;
    setPredicting(true);
    pollutionApi.getPredictions(selectedZone)
      .then(setPrediction)
      .finally(() => setPredicting(false));
  }, [selectedZone]);

  if (loading) return <LoadingSpinner text="Loading zones..." />;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-bold">AQI Predictions</h1>
        <p className="text-slate-500 mt-1">Forecast air quality for 6, 12, 24, and 72 hours ahead</p>
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

      {predicting ? (
        <LoadingSpinner text="Generating predictions..." />
      ) : prediction && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card text-center">
              <p className="text-sm text-slate-500 mb-2">Current</p>
              <AQIBadge aqi={prediction.current_aqi} size="lg" showCategory />
            </motion.div>
            {prediction.predictions.map((p, i) => (
              <motion.div
                key={p.hours_ahead}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
                className="card text-center"
              >
                <div className="flex items-center justify-center gap-1 text-sm text-slate-500 mb-2">
                  <Clock className="w-3.5 h-3.5" />
                  {p.hours_ahead}h
                </div>
                <AQIBadge aqi={p.aqi} size="md" showCategory category={p.category} />
                <p className="text-xs text-slate-400 mt-2">
                  Confidence: {(p.confidence * 100).toFixed(0)}%
                </p>
              </motion.div>
            ))}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Forecast Trend — {prediction.zone_name}</h2>
            <PredictionChart predictions={prediction.predictions} currentAqi={prediction.current_aqi} />
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Detailed Forecast</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Horizon</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">AQI</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">PM2.5</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.predictions.map((p) => (
                    <tr key={p.hours_ahead} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-4">{p.hours_ahead} hours</td>
                      <td className="py-3 px-4 font-bold" style={{ color: getAqiColor(p.aqi) }}>
                        {Math.round(p.aqi)}
                      </td>
                      <td className="py-3 px-4">{p.pm25} µg/m³</td>
                      <td className="py-3 px-4">{p.category}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${p.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs">{(p.confidence * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingDown } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { WhatIfChart } from '../components/charts/Charts';
import { aiApi, pollutionApi } from '../services/endpoints';
import type { WhatIfResult, Zone } from '../types';
import { getAqiColor } from '../utils/aqi';

const INTERVENTIONS = [
  { id: 'odd-even', label: 'Odd-Even Vehicle Rationing', reduction: 22 },
  { id: 'construction-ban', label: 'Construction Activity Ban', reduction: 18 },
  { id: 'dust-suppression', label: 'Road Dust Suppression', reduction: 12 },
  { id: 'industrial-audit', label: 'Industrial Emission Audit', reduction: 15 },
  { id: 'public-transport', label: 'Public Transport Surge', reduction: 10 },
  { id: 'green-buffers', label: 'Green Buffer Zones', reduction: 8 },
  { id: 'biomass-control', label: 'Biomass Burning Control', reduction: 14 },
  { id: 'work-from-home', label: 'Work From Home Policy', reduction: 9 },
];

export default function SimulatorPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [duration, setDuration] = useState(24);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setSelectedZone(z[0].zone_id);
    });
  }, []);

  const toggleIntervention = (id: string) => {
    setSelectedInterventions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const runSimulation = async () => {
    if (!selectedInterventions.length) return;
    setLoading(true);
    try {
      const data = await aiApi.simulateWhatIf(selectedZone, selectedInterventions, duration);
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FlaskConical className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">What-If Simulator</h1>
            <p className="text-slate-500">Test intervention scenarios before implementing them</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Configure Scenario</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="input-field">
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Duration: {duration} hours
            </label>
            <input
              type="range"
              min={6}
              max={72}
              step={6}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select Interventions</label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {INTERVENTIONS.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedInterventions.includes(item.id)
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedInterventions.includes(item.id)}
                    onChange={() => toggleIntervention(item.id)}
                    className="w-4 h-4 text-primary-600 rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-green-600">~{item.reduction} AQI reduction</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={runSimulation}
            disabled={loading || !selectedInterventions.length}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        <div className="lg:col-span-2">
          {loading && <LoadingSpinner text="Running simulation..." />}
          {result && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                  <p className="text-xs text-slate-500 mb-1">Baseline AQI</p>
                  <p className="text-2xl font-bold" style={{ color: getAqiColor(result.baseline_aqi) }}>
                    {Math.round(result.baseline_aqi)}
                  </p>
                </div>
                <div className="card text-center">
                  <p className="text-xs text-slate-500 mb-1">Projected AQI</p>
                  <p className="text-2xl font-bold" style={{ color: getAqiColor(result.projected_aqi) }}>
                    {Math.round(result.projected_aqi)}
                  </p>
                </div>
                <div className="card text-center bg-green-50">
                  <TrendingDown className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-600">
                    -{result.reduction_percentage}%
                  </p>
                  <p className="text-xs text-slate-500">{result.aqi_reduction} AQI points</p>
                </div>
              </div>

              <div className="card">
                <h3 className="font-semibold mb-4">Projected AQI Timeline</h3>
                <WhatIfChart timeline={result.timeline} baseline={result.baseline_aqi} />
              </div>

              <div className="card bg-slate-50">
                <h3 className="font-semibold mb-2">Impact Summary</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{result.impact_summary}</p>
              </div>
            </motion.div>
          )}
          {!result && !loading && (
            <div className="card flex flex-col items-center justify-center h-64 text-slate-400">
              <FlaskConical className="w-12 h-12 mb-3" />
              <p>Select interventions and run a simulation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

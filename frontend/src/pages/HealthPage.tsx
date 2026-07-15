import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { aiApi, pollutionApi } from '../services/endpoints';
import type { HealthAdvice, Zone } from '../types';
import { getRiskColor } from '../utils/aqi';

export default function HealthPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [form, setForm] = useState({
    age: 35,
    has_asthma: false,
    has_heart_condition: false,
    activity_level: 'moderate',
    zone_id: '',
    outdoor_hours: 2,
  });
  const [advice, setAdvice] = useState<HealthAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setForm((f) => ({ ...f, zone_id: z[0].zone_id }));
    });
  }, []);

  const getAdvice = async () => {
    setLoading(true);
    try {
      const result = await aiApi.getHealthAdvice(form);
      setAdvice(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Citizen Health Assistant</h1>
            <p className="text-slate-500">Personalized health advice based on your profile and local air quality</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Your Health Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) })}
                className="input-field"
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
              <select
                value={form.zone_id}
                onChange={(e) => setForm({ ...form, zone_id: e.target.value })}
                className="input-field"
              >
                {zones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Activity Level</label>
            <select
              value={form.activity_level}
              onChange={(e) => setForm({ ...form, activity_level: e.target.value })}
              className="input-field"
            >
              <option value="low">Low (mostly indoors)</option>
              <option value="moderate">Moderate</option>
              <option value="high">High (outdoor exercise)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Planned Outdoor Hours Today</label>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={form.outdoor_hours}
              onChange={(e) => setForm({ ...form, outdoor_hours: parseFloat(e.target.value) })}
              className="w-full"
            />
            <p className="text-sm text-slate-500 text-center">{form.outdoor_hours} hours</p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_asthma}
                onChange={(e) => setForm({ ...form, has_asthma: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm">I have asthma or respiratory condition</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.has_heart_condition}
                onChange={(e) => setForm({ ...form, has_heart_condition: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded"
              />
              <span className="text-sm">I have a heart condition</span>
            </label>
          </div>
          <button onClick={getAdvice} disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Analyzing...' : 'Get Personalized Advice'}
          </button>
        </div>

        <div>
          {loading && <LoadingSpinner text="Generating health recommendations..." />}
          {advice && !loading && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <div className="card text-center">
                <p className="text-sm text-slate-500 mb-2">Your Risk Level</p>
                <p className={`text-3xl font-bold ${getRiskColor(advice.risk_level)}`}>
                  {advice.risk_level}
                </p>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold">Recommendations</h3>
                </div>
                <ul className="space-y-2">
                  {advice.recommendations.map((rec, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <span className="text-primary-500 mt-0.5">•</span>
                      {rec}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <Clock className="w-5 h-5 text-blue-500 mb-2" />
                  <p className="text-xs text-slate-500">Safe Outdoor Hours</p>
                  <p className="font-semibold text-sm">{advice.safe_outdoor_hours}</p>
                </div>
                <div className="card">
                  <ShieldCheck className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-xs text-slate-500">Mask Recommendation</p>
                  <p className="font-semibold text-sm">{advice.mask_recommendation}</p>
                </div>
              </div>

              <div className="card bg-blue-50 border-blue-200">
                <p className="text-sm text-slate-700 leading-relaxed">{advice.ai_summary}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

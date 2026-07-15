import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Target, DollarSign, Clock, Shield } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { aiApi, pollutionApi } from '../services/endpoints';
import type { InterventionPlan, Zone } from '../types';
import { getPriorityColor } from '../utils/aqi';

export default function InterventionsPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [budget, setBudget] = useState('medium');
  const [plan, setPlan] = useState<InterventionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setSelectedZone(z[0].zone_id);
    });
  }, []);

  const generatePlan = async () => {
    setLoading(true);
    try {
      const result = await aiApi.planInterventions(selectedZone, budget);
      setPlan(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-xl">
            <Brain className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Intervention Planner</h1>
            <p className="text-slate-500">Get specific government actions to reduce pollution before it becomes dangerous</p>
          </div>
        </div>
      </motion.div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Target Zone</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="input-field">
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Budget Level</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="input-field">
              <option value="low">Low Budget</option>
              <option value="medium">Medium Budget</option>
              <option value="high">High Budget</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={generatePlan} disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Analyzing...' : 'Generate Action Plan'}
            </button>
          </div>
        </div>
      </div>

      {loading && <LoadingSpinner text="AI is analyzing pollution data and generating recommendations..." />}

      {plan && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-bold">{plan.zone_name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    plan.risk_level === 'Critical' ? 'bg-red-100 text-red-700' :
                    plan.risk_level === 'High' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {plan.risk_level} Risk
                  </span>
                  <span className="text-sm text-slate-500">Current AQI: {Math.round(plan.current_aqi)}</span>
                </div>
                <p className="text-slate-700 leading-relaxed">{plan.ai_summary}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plan.actions.map((action, i) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">{action.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(action.priority)}`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Target className="w-4 h-4 text-green-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">AQI Reduction</p>
                    <p className="font-bold text-green-600">-{action.estimated_aqi_reduction}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Cost</p>
                    <p className="text-xs font-medium text-blue-600">{action.cost_estimate.split(' - ')[0]}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">Timeline</p>
                    <p className="text-xs font-medium text-purple-600">{action.timeline}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">Confidence:</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${action.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{(action.confidence * 100).toFixed(0)}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

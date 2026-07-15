import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StatCard from '../components/ui/StatCard';
import { HourlyTrendChart, CategoryPieChart } from '../components/charts/Charts';
import { analyticsApi } from '../services/endpoints';
import type { AdminAnalytics } from '../types';
import { getAqiColor } from '../utils/aqi';
import { Activity, AlertTriangle, MapPin, Shield } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;
  if (!data) return <div className="text-center text-slate-500 py-12">Failed to load analytics</div>;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Analytics</h1>
            <p className="text-slate-500">City-wide air quality analytics and trends</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Zones" value={data.total_zones} icon={MapPin} delay={0} />
        <StatCard title="City Avg AQI" value={Math.round(data.city_avg_aqi)} icon={Activity} aqi={data.city_avg_aqi} delay={0.1} />
        <StatCard title="Unhealthy Zones" value={data.unhealthy_zones} icon={AlertTriangle} delay={0.2} />
        <StatCard title="Active Interventions" value={data.interventions_active} icon={Shield} delay={0.3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
          <h2 className="font-semibold mb-4">24-Hour AQI Trend</h2>
          <HourlyTrendChart data={data.hourly_trend} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
          <h2 className="font-semibold mb-4">Category Distribution</h2>
          <CategoryPieChart data={data.category_distribution} />
        </motion.div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Zone Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Zone</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Avg AQI</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Min</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Max</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.zones.map((zone) => (
                <tr key={zone.zone_id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium">{zone.zone_name}</td>
                  <td className="py-3 px-4 font-bold" style={{ color: getAqiColor(zone.avg_aqi) }}>
                    {Math.round(zone.avg_aqi)}
                  </td>
                  <td className="py-3 px-4">{Math.round(zone.min_aqi)}</td>
                  <td className="py-3 px-4">{Math.round(zone.max_aqi)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      zone.trend === 'rising' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {zone.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

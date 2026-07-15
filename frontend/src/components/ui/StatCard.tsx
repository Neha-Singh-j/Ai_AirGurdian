import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { getAqiColor, getAqiTextClass } from '../../utils/aqi';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  aqi?: number;
  trend?: string;
  delay?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, aqi, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="card hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${aqi !== undefined ? getAqiTextClass(aqi) : 'text-slate-900'}`}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          {trend && (
            <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'rising' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {trend === 'rising' ? '↑ Rising' : '→ Stable'}
            </span>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: aqi !== undefined ? `${getAqiColor(aqi)}20` : '#eff6ff' }}
        >
          <Icon className="w-6 h-6" style={{ color: aqi !== undefined ? getAqiColor(aqi) : '#2563eb' }} />
        </div>
      </div>
    </motion.div>
  );
}

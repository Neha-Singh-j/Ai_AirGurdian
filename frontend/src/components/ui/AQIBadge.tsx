import { motion } from 'framer-motion';

interface AQIBadgeProps {
  aqi: number;
  size?: 'sm' | 'md' | 'lg';
  showCategory?: boolean;
  category?: string;
}

export default function AQIBadge({ aqi, size = 'md', showCategory, category }: AQIBadgeProps) {
  const getCategory = (val: number) => {
    if (val <= 50) return 'Good';
    if (val <= 100) return 'Moderate';
    if (val <= 150) return 'Unhealthy (Sensitive)';
    if (val <= 200) return 'Unhealthy';
    if (val <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const getColor = (val: number) => {
    if (val <= 50) return 'bg-aqi-good';
    if (val <= 100) return 'bg-aqi-moderate';
    if (val <= 150) return 'bg-aqi-unhealthy';
    if (val <= 200) return 'bg-aqi-veryUnhealthy';
    return 'bg-aqi-hazardous';
  };

  const sizeClasses = {
    sm: 'text-sm px-2 py-0.5',
    md: 'text-base px-3 py-1',
    lg: 'text-2xl px-4 py-2',
  };

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex flex-col items-center gap-1"
    >
      <span className={`${getColor(aqi)} text-white font-bold rounded-lg ${sizeClasses[size]}`}>
        AQI {Math.round(aqi)}
      </span>
      {showCategory && (
        <span className="text-xs text-slate-500 font-medium">
          {category || getCategory(aqi)}
        </span>
      )}
    </motion.div>
  );
}

export function getAqiColor(aqi: number): string {
  if (aqi <= 50) return '#22c55e';
  if (aqi <= 100) return '#eab308';
  if (aqi <= 150) return '#f97316';
  if (aqi <= 200) return '#ef4444';
  if (aqi <= 300) return '#7c3aed';
  return '#581c87';
}

export function getAqiBgClass(aqi: number): string {
  if (aqi <= 50) return 'bg-aqi-good';
  if (aqi <= 100) return 'bg-aqi-moderate';
  if (aqi <= 150) return 'bg-aqi-unhealthy';
  if (aqi <= 200) return 'bg-aqi-veryUnhealthy';
  return 'bg-aqi-hazardous';
}

export function getAqiTextClass(aqi: number): string {
  if (aqi <= 50) return 'text-aqi-good';
  if (aqi <= 100) return 'text-aqi-moderate';
  if (aqi <= 150) return 'text-aqi-unhealthy';
  if (aqi <= 200) return 'text-aqi-veryUnhealthy';
  return 'text-aqi-hazardous';
}

export function getPriorityColor(priority: string): string {
  switch (priority.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default: return 'bg-green-100 text-green-800 border-green-200';
  }
}

export function getRiskColor(risk: string): string {
  switch (risk.toLowerCase()) {
    case 'critical': return 'text-red-600';
    case 'very high': return 'text-red-500';
    case 'high': return 'text-orange-500';
    case 'moderate': return 'text-yellow-600';
    default: return 'text-green-600';
  }
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}

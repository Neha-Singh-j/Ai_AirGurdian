import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/ui/LoadingSpinner';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HeatmapPage from './pages/HeatmapPage';
import PredictionsPage from './pages/PredictionsPage';
import AttributionPage from './pages/AttributionPage';
import InterventionsPage from './pages/InterventionsPage';
import HealthPage from './pages/HealthPage';
import SimulatorPage from './pages/SimulatorPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner fullScreen />;
  if (!token) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/heatmap" element={<ProtectedRoute><HeatmapPage /></ProtectedRoute>} />
      <Route path="/predictions" element={<ProtectedRoute><PredictionsPage /></ProtectedRoute>} />
      <Route path="/attribution" element={<ProtectedRoute><AttributionPage /></ProtectedRoute>} />
      <Route path="/interventions" element={<ProtectedRoute><InterventionsPage /></ProtectedRoute>} />
      <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />
      <Route path="/simulator" element={<ProtectedRoute><SimulatorPage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

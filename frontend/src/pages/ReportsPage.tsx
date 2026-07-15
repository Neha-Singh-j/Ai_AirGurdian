import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, CheckCircle } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { aiApi, pollutionApi } from '../services/endpoints';
import type { Zone } from '../types';
import { useAuth } from '../context/AuthContext';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [reportType, setReportType] = useState('comprehensive');
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{
    id: number;
    title: string;
    download_url: string;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    pollutionApi.getZones().then((z) => {
      setZones(z);
      if (z.length) setSelectedZone(z[0].zone_id);
    });
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const report = await aiApi.generateReport(selectedZone, reportType);
      setGeneratedReport(report);
    } catch {
      alert('Report generation requires admin or analyst role.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (generatedReport) {
      window.open(generatedReport.download_url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-xl">
            <FileText className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI-Generated Reports</h1>
            <p className="text-slate-500">Generate comprehensive PDF reports for government briefings</p>
          </div>
        </div>
      </motion.div>

      {!isAdmin && (
        <div className="card bg-amber-50 border-amber-200 text-amber-800 text-sm">
          Report generation is available for admin and analyst accounts. Log in with admin credentials to generate reports.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="font-semibold">Report Configuration</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zone</label>
            <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="input-field">
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
            <div className="space-y-2">
              {[
                { value: 'comprehensive', label: 'Comprehensive Report', desc: 'Full analysis with predictions, sources, and recommendations' },
                { value: 'executive', label: 'Executive Summary', desc: 'Brief overview for leadership briefings' },
                { value: 'health', label: 'Health Impact Report', desc: 'Focus on public health implications' },
              ].map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    reportType === type.value ? 'bg-primary-50 border border-primary-200' : 'bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type.value}
                    checked={reportType === type.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-slate-500">{type.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={generateReport}
            disabled={loading || !isAdmin}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Generating PDF...' : 'Generate Report'}
          </button>
        </div>

        <div>
          {loading && <LoadingSpinner text="AI is compiling the report..." />}
          {generatedReport && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Report Generated!</h3>
              <p className="text-sm text-slate-600 mb-1">{generatedReport.title}</p>
              <p className="text-xs text-slate-400 mb-6">
                Generated at {new Date(generatedReport.created_at).toLocaleString()}
              </p>
              <button onClick={downloadReport} className="btn-primary inline-flex items-center gap-2 px-6 py-3">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </motion.div>
          )}
          {!generatedReport && !loading && (
            <div className="card flex flex-col items-center justify-center h-64 text-slate-400">
              <FileText className="w-12 h-12 mb-3" />
              <p>Configure and generate a report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

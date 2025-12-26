import { useState, useEffect } from 'react';
import { FiPlay, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { format } from 'date-fns';
import { adminAPI } from '../services/api';

function AdminPanel() {
  const [jobs, setJobs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState({});

  useEffect(() => {
    loadAdminData();
    const interval = setInterval(loadAdminData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadAdminData = async () => {
    try {
      const [jobsData, logsData, statsData, healthData] = await Promise.all([
        adminAPI.getJobs(),
        adminAPI.getLogs({ limit: 50 }),
        adminAPI.getDatabaseStats(),
        adminAPI.getHealth()
      ]);

      setJobs(jobsData.data);
      setLogs(logsData.data);
      setDbStats(statsData.data);
      setHealth(healthData.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerJob = async (marketplace) => {
    setTriggering(prev => ({ ...prev, [marketplace]: true }));
    try {
      await adminAPI.triggerJob(marketplace);
      alert(`${marketplace} scraping job triggered successfully!`);
      setTimeout(loadAdminData, 2000); // Refresh after 2 seconds
    } catch (error) {
      alert(`Failed to trigger ${marketplace} job: ${error.message}`);
    } finally {
      setTriggering(prev => ({ ...prev, [marketplace]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" size={20} />;
      case 'running':
        return <FiRefreshCw className="text-blue-500 animate-spin" size={20} />;
      case 'failed':
        return <FiXCircle className="text-red-500" size={20} />;
      default:
        return <FiClock className="text-gray-400" size={20} />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="loading-skeleton h-96"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Control Panel</h1>

      {/* System Health */}
      {health && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">System Health</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className={`text-lg font-bold ${health.status === 'healthy' ? 'text-green-600' : 'text-orange-600'}`}>
                {health.status.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="text-lg font-semibold">{Math.floor(health.uptime / 3600)}h</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Running Jobs</p>
              <p className="text-lg font-semibold">{health.jobs.running}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed Jobs</p>
              <p className="text-lg font-semibold text-red-600">{health.jobs.failed}</p>
            </div>
          </div>
          {health.issues.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-800 mb-2">Issues Detected:</p>
              <ul className="list-disc list-inside space-y-1">
                {health.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-700">{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Database Stats */}
      {dbStats && (
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Database Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Phones</p>
              <p className="text-2xl font-bold text-blue-600">{dbStats.phones?.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Populations</p>
              <p className="text-2xl font-bold text-green-600">{dbStats.phone_populations?.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Price Trends</p>
              <p className="text-2xl font-bold text-purple-600">{dbStats.price_trends?.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Logs</p>
              <p className="text-2xl font-bold text-orange-600">{dbStats.scraping_logs?.toLocaleString()}</p>
            </div>
          </div>
          {dbStats.database_size_mb && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Database Size</p>
              <p className="text-lg font-semibold">{Number(dbStats.database_size_mb).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      )}

      {/* Scraping Jobs */}
      <div className="card mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Scraping Jobs</h2>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{job.marketplace_name}</h3>
                    <p className="text-sm text-gray-600">
                      Schedule: Every {job.schedule_frequency} hours
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTriggerJob(job.marketplace_name)}
                  disabled={triggering[job.marketplace_name] || job.is_running}
                  className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {job.is_running ? (
                    <>
                      <FiRefreshCw className="animate-spin" />
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <FiPlay />
                      <span>Trigger Now</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Last Run</p>
                  <p className="font-medium">
                    {job.last_run ? format(new Date(job.last_run), 'MMM dd, HH:mm') : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Next Run</p>
                  <p className="font-medium">
                    {job.next_run ? format(new Date(job.next_run), 'MMM dd, HH:mm') : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Items Scraped</p>
                  <p className="font-medium">{job.items_scraped || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="font-medium">{job.duration || 0}s</p>
                </div>
              </div>

              {job.error_message && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {job.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Logs</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span className={`badge ${getLogLevelColor(log.log_level)} text-xs`}>
                {log.log_level}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{log.marketplace_name}</p>
                <p className="text-sm text-gray-600 truncate">{log.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;

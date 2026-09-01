import { useState, useEffect } from 'react';
import { Users, Map, Activity, TrendingUp, MapPin, BarChart2, Globe } from 'lucide-react';
import api from '../api/axios';

function StatCard({ icon: Icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo:  'from-indigo-500 to-purple-600 shadow-indigo-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    amber:   'from-amber-500 to-orange-600 shadow-amber-500/20',
    cyan:    'from-cyan-500 to-sky-600 shadow-cyan-500/20',
  };
  return (
    <div className="glass p-6 rounded-2xl flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-3xl font-extrabold text-white">{value?.toLocaleString() ?? '—'}</p>
      </div>
    </div>
  );
}

function SimpleBar({ data, labelKey, valueKey, color = '#6366f1' }) {
  if (!data || data.length === 0) return <p className="text-slate-500 text-sm text-center py-6">No data available.</p>;
  const max = Math.max(...data.map(d => d[valueKey]));
  return (
    <div className="space-y-3">
      {data.slice(0, 8).map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="text-slate-300 text-sm w-28 truncate flex-shrink-0">{item[labelKey]}</div>
          <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden">
            <div
              className="h-full rounded-lg transition-all duration-700"
              style={{ width: `${Math.max((item[valueKey] / max) * 100, 4)}%`, background: color }}
            />
          </div>
          <div className="text-slate-300 text-sm font-semibold w-10 text-right flex-shrink-0">{item[valueKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
    } catch (err) {
      setError('Failed to load admin stats. Make sure you are authorized.');
      console.error('[Admin]', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading platform analytics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-white font-bold text-xl mb-2">Access Restricted</p>
        <p className="text-slate-400 text-sm">{error}</p>
      </div>
    </div>
  );

  const { totals, top_cities, top_categories, recent_users, sharing_breakdown } = stats;

  // Sharing breakdown
  const publicCount  = sharing_breakdown?.find(s => s.sharing_status === 'public')?.count  || 0;
  const privateCount = sharing_breakdown?.find(s => s.sharing_status === 'private')?.count || 0;
  const totalTrips   = totals?.trips || 1;

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto">

        {/* Header */}
        <div className="glass p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <BarChart2 size={18} className="text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white">Admin Analytics</h1>
            </div>
            <p className="text-slate-400 text-sm ml-13">Platform-wide usage statistics and insights</p>
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}    label="Total Users"      value={totals?.users}      color="indigo" />
          <StatCard icon={Map}      label="Trips Created"    value={totals?.trips}      color="emerald" />
          <StatCard icon={MapPin}   label="City Stops"       value={totals?.stops}      color="amber" />
          <StatCard icon={Activity} label="Activities Added" value={totals?.activities} color="cyan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Top cities */}
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <MapPin size={16} className="text-indigo-400" /> Top Destinations
            </h2>
            <SimpleBar data={top_cities} labelKey="city_name" valueKey="visit_count" color="#6366f1" />
          </div>

          {/* Category breakdown */}
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <Activity size={16} className="text-emerald-400" /> Activities by Category
            </h2>
            <SimpleBar data={top_categories} labelKey="category" valueKey="count" color="#10b981" />
          </div>
        </div>

        {/* Sharing stats + trips over time */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Sharing split */}
          <div className="glass p-6 rounded-2xl">
            <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <Globe size={16} className="text-cyan-400" /> Trip Visibility
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Private', count: privateCount, color: 'bg-slate-500' },
                { label: 'Public',  count: publicCount,  color: 'bg-emerald-500' },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-300">{label}</span>
                    <span className="text-white font-semibold">{count} ({Math.round((count / totalTrips) * 100)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${Math.max((count / totalTrips) * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trips over time (last 30 days) */}
          <div className="glass p-6 rounded-2xl lg:col-span-2">
            <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" /> Trips Created (Last 30 Days)
            </h2>
            {stats.trips_over_time?.length > 0 ? (
              <div className="flex items-end gap-1 h-32">
                {stats.trips_over_time.map((d, i) => {
                  const max = Math.max(...stats.trips_over_time.map(x => x.count));
                  const h = Math.max((d.count / max) * 100, 4);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="absolute -top-6 text-xs text-slate-400 opacity-0 group-hover:opacity-100 whitespace-nowrap">{d.count}</div>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all duration-300 hover:from-indigo-500 hover:to-cyan-400"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">No trip data in the last 30 days.</div>
            )}
          </div>
        </div>

        {/* Recent users table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Users size={16} className="text-indigo-400" /> Recent Users
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-center p-4">Trips</th>
                  <th className="text-right p-4">Joined</th>
                </tr>
              </thead>
              <tbody>
                {(recent_users || []).map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <span className="text-white font-semibold text-sm">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{u.email}</td>
                    <td className="p-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold">{u.trip_count}</span>
                    </td>
                    <td className="p-4 text-right text-slate-400 text-sm">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

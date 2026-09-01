import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const Budget = () => {
  const [tripId, setTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#64748b'];

  async function fetchBudget(activeTripId) {
    try {
      const res = await api.get(`/trips/${activeTripId}/budget`);
      setBudgetData(res.data.data ? res.data.data : res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load budget data.');
      setLoading(false);
    }
  };

  useEffect(() => { 
    const initData = async () => {
      try {
        const tripsRes = await api.get('/trips');
        const fetchedTrips = tripsRes.data.data?.trips || [];
        setTrips(fetchedTrips);
        if (fetchedTrips.length > 0) {
          const activeTripId = fetchedTrips[0].id;
          setTripId(activeTripId);
          fetchBudget(activeTripId);
        } else {
          setError('No trips found. Please create a trip first.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch trips. Please login again.');
        setLoading(false);
      }
    };
    initData();
  }, []);


  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass p-12 text-center">
        <div className="text-6xl mb-4 animate-bounce">💰</div>
        <p className="text-white font-bold text-xl">Loading Budget...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-full min-h-[70vh] px-6">
      <div className="glass p-12 text-center max-w-lg w-full">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-white font-extrabold text-2xl mb-3">{error.includes('No trips') ? 'No Trips Yet' : 'Could not load budget'}</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary px-8 py-3 w-full justify-center">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="glass p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-emerald-500/5" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-2">Trip Budget & Expenses</h1>
              <p className="text-slate-400 text-lg">Keep track of your spending to avoid surprises.</p>
            </div>
            {trips.length > 0 && (
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <label className="text-slate-400 text-xs font-bold uppercase tracking-wider">Select Trip</label>
                <select
                  value={tripId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    setTripId(id);
                    fetchBudget(id);
                  }}
                  className="px-5 py-3 rounded-xl bg-slate-800/90 border border-slate-600 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-lg hover:border-slate-500"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {budgetData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Summary Cards */}
            <div className="md:col-span-1 space-y-6">
              <div className="glass p-8 hover:border-indigo-500/30 transition-all group">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-indigo-400 transition-colors">Total Budget</h3>
                <p className="text-4xl font-extrabold text-white">
                  {budgetData.total_budget.toLocaleString()} <span className="text-lg text-slate-500">{budgetData.currency || 'USD'}</span>
                </p>
              </div>
              
              <div className="glass p-8 hover:border-pink-500/30 transition-all group">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 group-hover:text-pink-400 transition-colors">Total Spent</h3>
                <p className="text-4xl font-extrabold text-pink-400">
                  {budgetData.total_spent.toLocaleString()} <span className="text-lg text-pink-400/40">{budgetData.currency || 'USD'}</span>
                </p>
              </div>

              <div className={`glass p-8 transition-all ${budgetData.remaining >= 0 ? 'hover:border-emerald-500/30' : 'hover:border-red-500/30'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${budgetData.remaining >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  Remaining Balance
                </h3>
                <p className={`text-4xl font-extrabold ${budgetData.remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {budgetData.remaining.toLocaleString()} <span className="text-lg opacity-50">{budgetData.currency || 'USD'}</span>
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="md:col-span-2 glass p-10 flex flex-col">
              <h3 className="text-xl font-bold text-white mb-6">Expenses by Category</h3>
              {(!budgetData.by_category || budgetData.by_category.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-16">
                  <div className="text-6xl mb-4 opacity-50">💸</div>
                  <p className="text-lg font-medium text-slate-300">No expenses recorded yet.</p>
                  <p className="text-sm mt-1">Add activities to your itinerary to see your chart!</p>
                </div>
              ) : (
                <div className="flex-1 min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={budgetData.by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={5}>
                        {budgetData.by_category.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} ${budgetData.currency || 'USD'}`} contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#f1f5f9' }} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;

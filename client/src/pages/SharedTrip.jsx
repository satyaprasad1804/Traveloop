import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';

const SharedTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);

  async function fetchTrip() {
    if (!tripId) {
      setError('No trip ID provided.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.get(`/trips/public/${tripId}`);
      
      if (res.data && res.data.data) {
        const { trip, stops } = res.data.data;
        setTrip({ ...trip, stops });
      } else {
        setTrip(res.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('This trip is private or does not exist.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrip();
  }, [tripId]);


  const handleCopyTrip = () => {
    // The copy-trip API endpoint does not exist on the server.
    // For now, prompt the user to log in and clone manually.
    navigate('/login');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-6 text-white">
      <div className="glass p-12 text-center">
        <div className="text-6xl mb-4 animate-spin">🌍</div>
        <p className="text-xl font-bold">Loading Shared Trip...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-6">
      <div className="glass p-12 text-center max-w-lg w-full">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-white font-extrabold text-2xl mb-3">Access Denied</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate('/')} className="btn-primary px-8 py-3 w-full justify-center">Go Home</button>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        
        {/* Hero Section */}
        <div className="glass p-10 relative overflow-hidden text-center rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-white mb-6 inline-block border border-white/20">Public Trip</span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              {trip.title ? trip.title.replace(/hackathon/gi, '').trim() : 'Trip'}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">{trip.description || 'No description provided.'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Itinerary */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-8">
              <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Itinerary Preview</h2>
              
              {(!trip.stops || trip.stops.length === 0) ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-6xl mb-4 opacity-50">🗺️</div>
                  <p className="text-lg">No stops have been added to this trip yet.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-indigo-500/30 ml-6 space-y-12 pb-8">
                  {trip.stops.map((stop, idx) => (
                    <div key={stop.id} className="relative pl-10">
                      <div className="absolute -left-[11px] top-2 flex h-5 w-5 items-center justify-center">
                        {idx === 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />}
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500 border-4 border-slate-900 shadow-sm" />
                      </div>
                      
                      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                              {stop.city_name} 
                              {stop.country_code && <span className="text-sm font-normal text-slate-400 bg-white/10 px-2 py-0.5 rounded ml-3 align-middle">{stop.country_code}</span>}
                            </h3>
                          </div>
                          <span className="text-sm font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full">Stop {idx + 1}</span>
                        </div>

                        {stop.activities && stop.activities.length > 0 ? (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-4">Activities</h4>
                            {stop.activities.map(act => (
                              <div key={act.id} className="flex items-center gap-4 p-4 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl shadow-inner">
                                  {act.category === 'food' ? '🍕' : act.category === 'accommodation' ? '🏨' : act.category === 'transport' ? '✈️' : '📸'}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-200 text-lg">{act.title}</p>
                                  <p className="text-sm text-slate-400 capitalize">{act.category} &bull; {act.cost > 0 ? `$${act.cost}` : 'Free'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic bg-black/10 p-4 rounded-xl">No activities planned.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar / Action Bar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass p-8 sticky top-32">
              <div className="text-6xl mb-6 text-center">✨</div>
              <h3 className="text-2xl font-bold text-white mb-3 text-center">Like this itinerary?</h3>
              <p className="text-slate-400 mb-8 text-center">Copy this trip to your account and customize it for your own adventure!</p>
              
              <button 
                onClick={handleCopyTrip}
                disabled={copying}
                className="btn-primary w-full py-4 text-lg justify-center shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none"
              >
                {copying ? 'Copying...' : 'Copy Trip to Dashboard'}
              </button>

              <button 
                onClick={() => window.print()}
                className="w-full mt-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all font-semibold"
              >
                Print Itinerary
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SharedTrip;

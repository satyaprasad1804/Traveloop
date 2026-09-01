import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, DollarSign, Clock, Globe, Lock, Edit3, Printer } from 'lucide-react';
import api from '../api/axios';

const CATEGORY_ICONS = {
  sightseeing:   { icon: '🏛️', color: 'from-blue-500 to-indigo-600' },
  food:          { icon: '🍕', color: 'from-orange-500 to-amber-600' },
  transport:     { icon: '✈️', color: 'from-cyan-500 to-sky-600' },
  accommodation: { icon: '🏨', color: 'from-purple-500 to-violet-600' },
  adventure:     { icon: '🧗', color: 'from-green-500 to-emerald-600' },
  shopping:      { icon: '🛍️', color: 'from-pink-500 to-rose-600' },
  other:         { icon: '📌', color: 'from-slate-500 to-slate-600' },
};

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(dt) {
  if (!dt) return null;
  return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function ItineraryViewPage() {
  const { tripId } = useParams();
  const navigate   = useNavigate();

  const [trip, setTrip]   = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'list'

  useEffect(() => { fetchItinerary(); }, [tripId]);

  const fetchItinerary = async () => {
    setLoading(true);
    try {
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/stops`),
      ]);
      const tripData  = tripRes.data.data.trip;
      const stopsData = stopsRes.data.data?.stops || [];

      // Fetch activities for each stop
      const stopsWithActs = await Promise.all(
        stopsData.map(async s => {
          try {
            const aRes = await api.get(`/stops/${s.id}/activities`);
            return { ...s, activities: aRes.data.data?.activities || [] };
          } catch {
            return { ...s, activities: [] };
          }
        })
      );

      setTrip(tripData);
      setStops(stopsWithActs);
    } catch (err) {
      setError('Failed to load itinerary. Please try again.');
      console.error('[ItineraryView]', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Building your itinerary...</p>
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center max-w-md">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-white font-bold text-xl mb-2">{error || 'Trip not found'}</p>
        <Link to="/trips" className="text-indigo-400 hover:underline text-sm">Back to My Trips</Link>
      </div>
    </div>
  );

  const totalCost = stops.reduce(
    (sum, s) => sum + s.activities.reduce((a, b) => a + parseFloat(b.cost || 0), 0), 0
  );
  const totalActivities = stops.reduce((sum, s) => sum + s.activities.length, 0);
  const isPublic = trip.sharing_status === 'public';

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-5xl mx-auto">

        {/* Back */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/trips" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> My Trips
          </Link>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/builder/${tripId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 font-semibold text-sm transition-all"
            >
              <Edit3 size={14} /> Edit
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10 font-semibold text-sm transition-all"
            >
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="glass rounded-2xl overflow-hidden mb-8 relative">
          {trip.cover_image_url && (
            <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${trip.cover_image_url})` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/15 to-purple-500/5" />
          <div className="relative z-10 p-8 md:p-10">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 block">Itinerary Overview</span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3">{trip.title}</h1>
            {trip.description && <p className="text-slate-300 max-w-2xl mb-6">{trip.description}</p>}

            {/* Stats row */}
            <div className="flex flex-wrap gap-6">
              {[
                { icon: <MapPin size={16} />, label: `${stops.length} Cit${stops.length !== 1 ? 'ies' : 'y'}` },
                { icon: <Calendar size={16} />, label: trip.start_date ? `${fmt(trip.start_date)}${trip.end_date ? ` → ${fmt(trip.end_date)}` : ''}` : 'Dates TBD' },
                { icon: <Clock size={16} />, label: `${totalActivities} Activit${totalActivities !== 1 ? 'ies' : 'y'}` },
                { icon: <DollarSign size={16} />, label: `Est. $${totalCost.toFixed(0)} spent` },
                { icon: isPublic ? <Globe size={16} /> : <Lock size={16} />, label: trip.sharing_status },
              ].map(({ icon, label }, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-indigo-400">{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* View toggle */}
          <div className="relative z-10 border-t border-white/10 px-8 py-3 flex gap-2">
            {['timeline', 'list'].map(m => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
                  viewMode === m
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'timeline' ? '📅 Timeline' : '📋 List'}
              </button>
            ))}
            {isPublic && (
              <Link
                to={`/public/${tripId}`}
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
              >
                <Globe size={12} /> Public Link
              </Link>
            )}
          </div>
        </div>

        {/* No stops empty state */}
        {stops.length === 0 && (
          <div className="glass p-16 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-white mb-3">No stops planned yet</h2>
            <p className="text-slate-400 mb-6">Head over to the builder to add cities and activities.</p>
            <Link to={`/builder/${tripId}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg hover:-translate-y-0.5 transition-all">
              Open Builder →
            </Link>
          </div>
        )}

        {/* Timeline view */}
        {viewMode === 'timeline' && stops.length > 0 && (
          <div className="relative">
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-cyan-500 opacity-30" />
            <div className="space-y-10">
              {stops.map((stop, idx) => {
                const stopTotal = stop.activities.reduce((s, a) => s + parseFloat(a.cost || 0), 0);
                return (
                  <div key={stop.id} className="relative pl-20">
                    {/* Timeline dot */}
                    <div className="absolute left-4 top-6 flex flex-col items-center">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/40 z-10">
                        {idx + 1}
                      </div>
                      {idx === 0 && (
                        <div className="absolute -inset-1 rounded-xl bg-indigo-500/20 animate-pulse" />
                      )}
                    </div>

                    {/* Stop card */}
                    <div className="glass p-6 rounded-2xl">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-white">{stop.city_name}</h2>
                            {stop.country_code && (
                              <span className="text-xs font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{stop.country_code}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-slate-400 text-sm">
                            {stop.arrival_date && (
                              <span className="flex items-center gap-1"><Calendar size={12} /> {fmt(stop.arrival_date)}</span>
                            )}
                            {stop.arrival_date && stop.departure_date && <span>→</span>}
                            {stop.departure_date && <span>{fmt(stop.departure_date)}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-xs">Est. cost</div>
                          <div className="text-white font-bold text-lg">${stopTotal.toFixed(0)}</div>
                        </div>
                      </div>

                      {stop.activities.length === 0 ? (
                        <p className="text-slate-500 text-sm italic text-center py-4">No activities added yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {stop.activities.map(act => {
                            const cat = CATEGORY_ICONS[act.category] || CATEGORY_ICONS.other;
                            return (
                              <div key={act.id} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-xl border border-white/5">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-lg shadow-md flex-shrink-0`}>
                                  {cat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-white font-semibold text-sm truncate">{act.title}</p>
                                    {act.is_booked === 1 && (
                                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">✓ Booked</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
                                    <span className="capitalize">{act.category}</span>
                                    {act.location_name && <span>· 📍 {act.location_name}</span>}
                                    {act.start_time && <span className="flex items-center gap-0.5"><Clock size={10} /> {fmtTime(act.start_time)}</span>}
                                  </div>
                                </div>
                                {parseFloat(act.cost) > 0 && (
                                  <div className="text-slate-200 font-semibold text-sm flex-shrink-0">
                                    ${parseFloat(act.cost).toFixed(0)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && stops.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr className="text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left p-4">City</th>
                  <th className="text-left p-4">Arrival</th>
                  <th className="text-left p-4">Departure</th>
                  <th className="text-center p-4">Activities</th>
                  <th className="text-right p-4">Est. Cost</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((stop, idx) => {
                  const stopTotal = stop.activities.reduce((s, a) => s + parseFloat(a.cost || 0), 0);
                  return (
                    <tr key={stop.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{stop.city_name}</p>
                            {stop.country_code && <p className="text-slate-500 text-xs">{stop.country_code}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 text-sm">{fmt(stop.arrival_date) || '—'}</td>
                      <td className="p-4 text-slate-300 text-sm">{fmt(stop.departure_date) || '—'}</td>
                      <td className="p-4 text-center">
                        <span className="text-slate-300 text-sm">{stop.activities.length}</span>
                      </td>
                      <td className="p-4 text-right text-white font-semibold">${stopTotal.toFixed(0)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-indigo-500/10 font-bold">
                  <td className="p-4 text-indigo-300 text-sm">Total</td>
                  <td colSpan={3} className="p-4 text-center text-slate-400 text-sm">{totalActivities} activities</td>
                  <td className="p-4 text-right text-indigo-300">${totalCost.toFixed(0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

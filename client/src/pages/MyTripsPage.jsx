import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, MapPin, Calendar, Trash2, Eye, Edit3, Globe, Lock, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const categoryColors = {
  'from-violet-500 to-indigo-600': 'Paris & Beyond',
  'from-emerald-500 to-teal-600': 'Asia Explorer',
  'from-pink-500 to-rose-600': 'Mediterranean',
  'from-amber-500 to-orange-600': 'Americas Road Trip',
};

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tripDays(start, end) {
  if (!start || !end) return null;
  const diff = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export default function MyTripsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTrips(); }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data?.trips || []);
    } catch (err) {
      console.error('[MyTrips] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tripId, e) => {
    e.stopPropagation();
    if (!confirm('Delete this trip? This cannot be undone.')) return;
    setDeletingId(tripId);
    try {
      await api.delete(`/trips/${tripId}`);
      setTrips(prev => prev.filter(t => t.id !== tripId));
    } catch (err) {
      console.error('[MyTrips] delete error', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = trips.filter(t => {
    if (filter === 'all') return true;
    return t.sharing_status === filter;
  });

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto">

        {/* Header */}
        <div className="glass p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-cyan-500/5" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-white mb-1">My Trips</h1>
              <p className="text-slate-400">
                {trips.length === 0 ? 'No trips yet — start planning your adventure!' : `${trips.length} trip${trips.length !== 1 ? 's' : ''} planned`}
              </p>
            </div>
            <Link
              to="/trips/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              <Plus size={20} /> Plan New Trip
            </Link>
          </div>

          {/* Filter tabs */}
          {trips.length > 0 && (
            <div className="relative z-10 flex gap-2 mt-6">
              {['all', 'private', 'public'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold capitalize transition-all ${
                    filter === f
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && trips.length === 0 && (
          <div className="glass p-16 text-center">
            <div className="text-7xl mb-6">🗺️</div>
            <h2 className="text-3xl font-bold text-white mb-3">No trips yet</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Start planning your first multi-city adventure. Add stops, activities, and track your budget — all in one place.
            </p>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              <Plus size={20} /> Create Your First Trip
            </Link>
          </div>
        )}

        {/* Trip grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((trip, idx) => {
              const coverImg = trip.cover_image_url || COVER_IMAGES[idx % COVER_IMAGES.length];
              const days = tripDays(trip.start_date, trip.end_date);
              return (
                <div
                  key={trip.id}
                  className="glass group overflow-hidden rounded-2xl hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer"
                  onClick={() => navigate(`/builder/${trip.id}`)}
                >
                  {/* Cover image */}
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={coverImg}
                      alt={trip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.src = COVER_IMAGES[0]; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                    {/* Sharing badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        trip.sharing_status === 'public'
                          ? 'bg-emerald-500/80 text-white backdrop-blur-sm'
                          : 'bg-slate-800/80 text-slate-300 backdrop-blur-sm'
                      }`}>
                        {trip.sharing_status === 'public' ? <Globe size={10} /> : <Lock size={10} />}
                        {trip.sharing_status}
                      </span>
                    </div>

                    {/* Days badge */}
                    {days && (
                      <div className="absolute bottom-3 left-3">
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/80 text-white text-xs font-semibold backdrop-blur-sm">
                          <Calendar size={10} /> {days} day{days !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-white font-bold text-lg mb-1 truncate group-hover:text-indigo-300 transition-colors">
                      {trip.title}
                    </h3>

                    {(trip.start_date || trip.end_date) && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-sm mb-3">
                        <Calendar size={12} />
                        <span>{formatDate(trip.start_date)}</span>
                        {trip.end_date && <><span>→</span><span>{formatDate(trip.end_date)}</span></>}
                      </div>
                    )}

                    {trip.description && (
                      <p className="text-slate-500 text-sm line-clamp-2 mb-4">{trip.description}</p>
                    )}

                    {/* Budget bar */}
                    {trip.total_budget > 0 && (
                      <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1"><TrendingUp size={10} /> Budget</span>
                        <span className="font-semibold text-slate-300">
                          {trip.currency || 'USD'} {Number(trip.total_budget).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-white/5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/builder/${trip.id}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 text-sm font-semibold transition-all"
                      >
                        <Edit3 size={13} /> Builder
                      </button>
                      <button
                        onClick={() => navigate(`/trips/${trip.id}/view`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-sm font-semibold transition-all"
                      >
                        <Eye size={13} /> View
                      </button>
                      {trip.sharing_status === 'public' && (
                        <button
                          onClick={() => navigate(`/public/${trip.id}`)}
                          className="flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-all"
                        >
                          <Globe size={13} />
                        </button>
                      )}
                      <button
                        disabled={deletingId === trip.id}
                        onClick={(e) => handleDelete(trip.id, e)}
                        className="flex items-center justify-center px-3 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"
                      >
                        {deletingId === trip.id
                          ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* No results for filter */}
        {!loading && trips.length > 0 && filtered.length === 0 && (
          <div className="glass p-12 text-center">
            <p className="text-slate-400">No {filter} trips found.</p>
            <button onClick={() => setFilter('all')} className="mt-4 text-indigo-400 text-sm hover:underline">
              Show all trips
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

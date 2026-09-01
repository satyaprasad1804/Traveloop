import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, TrendingUp, Plus, Globe, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function fmt(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=600&auto=format',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=600&auto=format',
];

const RECOMMENDED = [
  { city: 'Paris', country: 'France', tag: 'Romance', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=600' },
  { city: 'Tokyo', country: 'Japan',  tag: 'Culture', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=600' },
  { city: 'Bali',  country: 'Indonesia', tag: 'Beach', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=600' },
  { city: 'New York', country: 'USA', tag: 'Urban', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=600' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/trips')
      .then(res => setTrips(res.data.data?.trips || []))
      .catch(err => console.error('[Dashboard] fetch error', err))
      .finally(() => setLoading(false));
  }, []);

  const recentTrips = trips.slice(0, 3);

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto space-y-8">

        {/* Welcome hero */}
        <div className="glass p-10 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-cyan-500/10" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-3">
                Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! ✈️
              </h1>
              <p className="text-slate-400 text-lg max-w-xl">
                {trips.length === 0
                  ? "You haven't planned any trips yet. Let's start your first adventure!"
                  : `You have ${trips.length} trip${trips.length !== 1 ? 's' : ''} planned. Where to next?`}
              </p>
            </div>
            <Link
              to="/trips/new"
              className="flex-shrink-0 flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              <Plus size={22} /> Plan New Trip
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '✈️', label: 'Total Trips', value: trips.length },
            { icon: '🌍', label: 'Public Trips', value: trips.filter(t => t.sharing_status === 'public').length },
            { icon: '🗓️', label: 'Upcoming', value: trips.filter(t => t.start_date && new Date(t.start_date) > new Date()).length },
            { icon: '💰', label: 'Total Budget', value: `$${trips.reduce((s, t) => s + parseFloat(t.total_budget || 0), 0).toLocaleString()}` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="glass p-5 rounded-2xl text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-slate-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-white font-bold text-xl mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { to: '/trips',     icon: '🗺️', label: 'My Trips',       desc: 'View and manage all your trips',       color: 'from-indigo-500 to-purple-600' },
              { to: '/checklist', icon: '✅', label: 'Packing List',    desc: 'Never forget what to pack',            color: 'from-purple-500 to-pink-600' },
              { to: '/budget',    icon: '💰', label: 'Trip Budget',     desc: 'Track spend and stay in budget',       color: 'from-emerald-500 to-teal-600' },
              { to: '/notes',     icon: '📝', label: 'Travel Journal',  desc: 'Write trip notes and memories',        color: 'from-amber-500 to-orange-600' },
            ].map(({ to, icon, label, desc, color }) => (
              <Link
                key={to}
                to={to}
                className="glass group p-6 hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {icon}
                </div>
                <h3 className="text-white font-bold mb-1 group-hover:text-indigo-300 transition-colors">{label}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
                <div className="mt-3 text-indigo-400 text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight size={12} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent trips */}
        {!loading && recentTrips.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-xl">Recent Trips</h2>
              <Link to="/trips" className="text-indigo-400 text-sm font-semibold hover:text-indigo-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {recentTrips.map((trip, idx) => {
                const cover = trip.cover_image_url || COVER_IMAGES[idx % COVER_IMAGES.length];
                return (
                  <div
                    key={trip.id}
                    onClick={() => navigate(`/builder/${trip.id}`)}
                    className="glass group overflow-hidden rounded-2xl hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <img src={cover} alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={e => e.target.src = COVER_IMAGES[0]} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent" />
                      {trip.sharing_status === 'public' && (
                        <div className="absolute top-2 right-2">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 text-white text-xs font-semibold backdrop-blur-sm">
                            <Globe size={9} /> Public
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-bold truncate group-hover:text-indigo-300 transition-colors">{trip.title}</h3>
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                        <Calendar size={10} />
                        {trip.start_date ? fmt(trip.start_date) : 'Dates TBD'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="glass rounded-2xl h-44 animate-pulse" />
            ))}
          </div>
        )}

        {/* Recommended destinations */}
        <div>
          <h2 className="text-white font-bold text-xl mb-4">Discover Destinations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RECOMMENDED.map(({ city, country, tag, img }) => (
              <div key={city} className="glass group overflow-hidden rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => navigate('/trips/new')}>
                <div className="relative h-32 overflow-hidden">
                  <img src={img} alt={city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-semibold border border-white/20">{tag}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white font-bold text-sm">{city}</p>
                  <p className="text-slate-400 text-xs">{country}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

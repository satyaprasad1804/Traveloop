import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, GripVertical, MapPin, ChevronDown,
  ChevronRight, Clock, DollarSign, Tag, Globe, Lock,
  Check, X, Eye, Edit3,
} from 'lucide-react';
import api from '../api/axios';

const CATEGORY_ICONS = {
  sightseeing:   '🏛️',
  food:          '🍕',
  transport:     '✈️',
  accommodation: '🏨',
  adventure:     '🧗',
  shopping:      '🛍️',
  other:         '📌',
};

const CATEGORIES = Object.keys(CATEGORY_ICONS);

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Activity Form ─────────────────────────────────────────────
function ActivityForm({ stopId, onAdded, onCancel }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'sightseeing',
    cost: '', location_name: '', booking_ref: '', is_booked: false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/stops/${stopId}/activities`, {
        ...form,
        cost: parseFloat(form.cost) || 0,
      });
      onAdded(res.data.data.activity);
    } catch (err) {
      console.error('[ActivityForm] save error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-slate-800/60 border border-slate-600 rounded-xl p-4 space-y-3 mt-3">
      <input
        required
        autoFocus
        placeholder="Activity name *"
        value={form.title}
        onChange={e => set('title', e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.category}
          onChange={e => set('category', e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{CATEGORY_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <div className="relative">
          <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="number" min="0" step="0.01" placeholder="Cost"
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <input
        placeholder="Location name (optional)"
        value={form.location_name}
        onChange={e => set('location_name', e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
      />
      <input
        placeholder="Booking ref / confirmation # (optional)"
        value={form.booking_ref}
        onChange={e => set('booking_ref', e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
      />
      <textarea
        rows={2}
        placeholder="Notes (optional)"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-700/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all resize-none"
      />
      <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
        <input type="checkbox" checked={form.is_booked} onChange={e => set('is_booked', e.target.checked)}
          className="w-4 h-4 rounded border-slate-600 accent-indigo-500" />
        Mark as booked
      </label>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={saving || !form.title.trim()}
          className="flex-1 py-2 rounded-lg bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-1">
          {saving ? <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Add Activity</>}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm transition-all flex items-center gap-1">
          <X size={14} /> Cancel
        </button>
      </div>
    </form>
  );
}

// ── Stop Card ─────────────────────────────────────────────────
function StopCard({ stop, idx, onDelete, onAddActivity, onDeleteActivity }) {
  const [expanded, setExpanded] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activities, setActivities] = useState(stop.activities || []);
  const [loadingActs, setLoadingActs] = useState(false);

  useEffect(() => {
    if (expanded && activities.length === 0 && !showForm) {
      loadActivities();
    }
  }, [expanded, activities.length, showForm]);

  const loadActivities = async () => {
    setLoadingActs(true);
    try {
      const res = await api.get(`/stops/${stop.id}/activities`);
      setActivities(res.data.data?.activities || []);
    } catch (err) {
      console.error('[StopCard] load activities error', err);
    } finally {
      setLoadingActs(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!confirm('Remove this activity?')) return;
    try {
      await api.delete(`/stops/${stop.id}/activities/${activityId}`);
      setActivities(prev => prev.filter(a => a.id !== activityId));
    } catch (err) {
      console.error('[StopCard] delete activity error', err);
    }
  };

  const totalCost = activities.reduce((sum, a) => sum + parseFloat(a.cost || 0), 0);

  return (
    <div className="glass rounded-2xl overflow-hidden mb-4 transition-all">
      {/* Stop header */}
      <div className="flex items-center gap-3 p-5">
        <div className="text-slate-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={18} />
        </div>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-lg truncate">{stop.city_name}</h3>
            {stop.country_code && (
              <span className="text-xs font-semibold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded">{stop.country_code}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
            {stop.arrival_date && <span>📅 {fmt(stop.arrival_date)}</span>}
            {stop.arrival_date && stop.departure_date && <span>→</span>}
            {stop.departure_date && <span>{fmt(stop.departure_date)}</span>}
            {activities.length > 0 && <span>· {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}</span>}
            {totalCost > 0 && <span>· ${totalCost.toFixed(0)} est.</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 text-xs font-semibold transition-all"
          >
            <Plus size={12} /> Activity
          </button>
          <button
            onClick={() => onDelete(stop.id)}
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-all"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all"
          >
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Activity list */}
      {expanded && (
        <div className="px-5 pb-5">
          {loadingActs && (
            <div className="flex items-center gap-2 text-slate-500 text-sm py-4">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
              Loading activities...
            </div>
          )}

          {!loadingActs && activities.length === 0 && !showForm && (
            <div className="text-center py-6 text-slate-500 text-sm bg-slate-800/30 rounded-xl">
              No activities yet.{' '}
              <button onClick={() => setShowForm(true)} className="text-indigo-400 hover:underline">Add one</button>
            </div>
          )}

          {!loadingActs && activities.map(act => (
            <div key={act.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0 group">
              <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                {CATEGORY_ICONS[act.category] || '📌'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold text-sm truncate">{act.title}</span>
                  {act.is_booked === 1 && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Booked ✓</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-xs mt-0.5">
                  <span className="capitalize">{act.category}</span>
                  {parseFloat(act.cost) > 0 && <span>· ${parseFloat(act.cost).toFixed(0)}</span>}
                  {act.location_name && <span>· 📍 {act.location_name}</span>}
                </div>
              </div>
              <button
                onClick={() => handleDeleteActivity(act.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-500/15 rounded-lg transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {showForm && (
            <ActivityForm
              stopId={stop.id}
              onAdded={a => { setActivities(p => [...p, a]); setShowForm(false); }}
              onCancel={() => setShowForm(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Stop Form ─────────────────────────────────────────────
function AddStopForm({ tripId, onAdded, onCancel }) {
  const [city_name, setCityName] = useState('');
  const [country_code, setCountryCode] = useState('');
  const [arrival_date, setArrivalDate] = useState('');
  const [departure_date, setDepartureDate] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!city_name.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/trips/${tripId}/stops`, {
        city_name: city_name.trim(),
        country_code: country_code.toUpperCase() || undefined,
        arrival_date:   arrival_date   || undefined,
        departure_date: departure_date || undefined,
      });
      onAdded({ ...res.data.data.stop, activities: [] });
    } catch (err) {
      console.error('[AddStop] error', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass p-5 rounded-2xl space-y-3">
      <h4 className="text-white font-bold text-sm flex items-center gap-2"><MapPin size={14} className="text-indigo-400" /> Add a City Stop</h4>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <input
            required autoFocus
            placeholder="City name *"
            value={city_name}
            onChange={e => setCityName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
        <input
          placeholder="CC (e.g. FR)"
          maxLength={2}
          value={country_code}
          onChange={e => setCountryCode(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all uppercase"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="date" value={arrival_date} onChange={e => setArrivalDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]" />
        <input type="date" value={departure_date} min={arrival_date} onChange={e => setDepartureDate(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all [color-scheme:dark]" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving || !city_name.trim()}
          className="flex-1 py-2.5 rounded-lg bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50 transition-all">
          {saving ? 'Adding...' : '+ Add Stop'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 text-sm transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Main BuilderPage ──────────────────────────────────────────
export default function BuilderPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { fetchData(); }, [tripId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripRes, stopsRes] = await Promise.all([
        api.get(`/trips/${tripId}`),
        api.get(`/trips/${tripId}/stops`),
      ]);
      setTrip(tripRes.data.data.trip);
      setStops(stopsRes.data.data?.stops || []);
    } catch (err) {
      console.error('[Builder] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStop = async (stopId) => {
    if (!confirm('Remove this city stop and all its activities?')) return;
    try {
      await api.delete(`/trips/${tripId}/stops/${stopId}`);
      setStops(prev => prev.filter(s => s.id !== stopId));
    } catch (err) {
      console.error('[Builder] delete stop error', err);
    }
  };

  const handleToggleSharing = async () => {
    setSharing(true);
    try {
      const res = await api.patch(`/trips/${tripId}/share`);
      setTrip(prev => ({ ...prev, sharing_status: res.data.data.sharing_status }));
    } catch (err) {
      console.error('[Builder] share toggle error', err);
    } finally {
      setSharing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading itinerary...</p>
      </div>
    </div>
  );

  if (!trip) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="glass p-12 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-white font-bold text-xl mb-2">Trip not found</p>
        <Link to="/trips" className="text-indigo-400 hover:underline text-sm">Back to My Trips</Link>
      </div>
    </div>
  );

  const totalCost = stops.reduce((sum, s) => sum + (s.activities || []).reduce((a, b) => a + parseFloat(b.cost || 0), 0), 0);
  const isPublic = trip.sharing_status === 'public';

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-4xl mx-auto">

        {/* Back */}
        <Link to="/trips" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} /> My Trips
        </Link>

        {/* Trip header */}
        <div className="glass p-8 rounded-2xl mb-6 relative overflow-hidden">
          {trip.cover_image_url && (
            <div className="absolute inset-0 bg-cover bg-center opacity-15" style={{ backgroundImage: `url(${trip.cover_image_url})` }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">Itinerary Builder</span>
              <h1 className="text-4xl font-extrabold text-white mb-2">{trip.title}</h1>
              {trip.description && <p className="text-slate-400 text-sm max-w-xl">{trip.description}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-400">
                {trip.start_date && <span>📅 {fmt(trip.start_date)}{trip.end_date && ` → ${fmt(trip.end_date)}`}</span>}
                {trip.total_budget > 0 && <span>💰 Budget: {trip.currency} {Number(trip.total_budget).toLocaleString()}</span>}
                <span>{stops.length} stop{stops.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={handleToggleSharing}
                disabled={sharing}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isPublic
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                {isPublic ? 'Public' : 'Private'}
              </button>
              <button
                onClick={() => navigate(`/trips/${tripId}/view`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30 font-semibold text-sm transition-all"
              >
                <Eye size={14} /> View
              </button>
            </div>
          </div>
        </div>

        {/* Stops list */}
        {stops.length === 0 && !showAddStop && (
          <div className="glass p-16 text-center rounded-2xl mb-6">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-white mb-2">No stops yet</h2>
            <p className="text-slate-400 mb-6">Add your first destination city to get started!</p>
            <button
              onClick={() => setShowAddStop(true)}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all"
            >
              + Add First Stop
            </button>
          </div>
        )}

        {stops.map((stop, idx) => (
          <StopCard
            key={stop.id}
            stop={stop}
            idx={idx}
            onDelete={handleDeleteStop}
          />
        ))}

        {/* Add stop form / button */}
        {showAddStop ? (
          <AddStopForm
            tripId={tripId}
            onAdded={s => { setStops(prev => [...prev, s]); setShowAddStop(false); }}
            onCancel={() => setShowAddStop(false)}
          />
        ) : (
          stops.length > 0 && (
            <button
              onClick={() => setShowAddStop(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <Plus size={18} /> Add Another Stop
            </button>
          )
        )}

        {/* Quick links */}
        {stops.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { to: `/budget`, icon: '💰', label: 'Budget & Costs' },
              { to: `/checklist`, icon: '✅', label: 'Packing List' },
              { to: `/notes`, icon: '📝', label: 'Trip Notes' },
            ].map(({ to, icon, label }) => (
              <Link
                key={to}
                to={to}
                className="glass p-4 text-center rounded-xl hover:border-indigo-500/30 hover:-translate-y-0.5 transition-all"
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-slate-300 text-sm font-semibold">{label}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

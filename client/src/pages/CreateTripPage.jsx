import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Map, Calendar, DollarSign, FileText, Image, Globe } from 'lucide-react';
import api from '../api/axios';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'];

const COVER_SUGGESTIONS = [
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800',
  'https://images.unsplash.com/photo-1539627831859-a911cf04d3cd?q=80&w=800',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800',
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?q=80&w=800',
];

export default function CreateTripPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    currency: 'USD',
    sharing_status: 'private',
    cover_image_url: '',
  });
  const [selectedCover, setSelectedCover] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const payload = {
      title: form.title,
      description: form.description || undefined,
      start_date: form.start_date || undefined,
      end_date:   form.end_date   || undefined,
      total_budget: form.total_budget ? parseFloat(form.total_budget) : 0,
      currency:  form.currency,
      sharing_status: form.sharing_status,
      cover_image_url: selectedCover || form.cover_image_url || undefined,
    };

    setLoading(true);
    try {
      const res = await api.post('/trips', payload);
      const tripId = res.data.tripId;
      navigate(`/builder/${tripId}`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) setErrors(data.errors);
      else setErrors([data?.message || 'Failed to create trip.']);
      setLoading(false);
    }
  };

  const previewImage = selectedCover || form.cover_image_url;

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-3xl mx-auto">

        {/* Back link */}
        <Link
          to="/trips"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Back to My Trips
        </Link>

        {/* Header card */}
        <div className="glass p-8 rounded-2xl mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Map size={18} className="text-white" />
              </div>
              <h1 className="text-3xl font-extrabold text-white">Plan a New Trip</h1>
            </div>
            <p className="text-slate-400 ml-13">Fill in the details below — you can always edit them later.</p>
          </div>
        </div>

        {/* Error alert */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm space-y-1">
            {errors.map((e, i) => <p key={i}>⚠️ {e}</p>)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Trip name */}
          <div className="glass p-6 rounded-2xl">
            <label className="block text-slate-300 text-sm font-semibold mb-2">
              Trip Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Europe Summer 2026"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Dates */}
          <div className="glass p-6 rounded-2xl">
            <label className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-4">
              <Calendar size={14} /> Travel Dates
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-xs mb-1.5">End Date</label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={e => set('end_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="glass p-6 rounded-2xl">
            <label className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-4">
              <DollarSign size={14} /> Trip Budget
            </label>
            <div className="flex gap-3">
              <select
                value={form.currency}
                onChange={e => set('currency', e.target.value)}
                className="px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.total_budget}
                onChange={e => set('total_budget', e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div className="glass p-6 rounded-2xl">
            <label className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-2">
              <FileText size={14} /> Description
            </label>
            <textarea
              rows={3}
              placeholder="What's special about this trip? (optional)"
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Cover image */}
          <div className="glass p-6 rounded-2xl">
            <label className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-4">
              <Image size={14} /> Cover Photo
            </label>

            {/* Preset suggestions */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {COVER_SUGGESTIONS.map(url => (
                <button
                  key={url}
                  type="button"
                  onClick={() => { setSelectedCover(url); set('cover_image_url', ''); }}
                  className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedCover === url ? 'border-indigo-500 scale-95 shadow-lg shadow-indigo-500/30' : 'border-transparent hover:border-slate-500'
                  }`}
                >
                  <img src={url} alt="cover" className="w-full h-full object-cover" />
                  {selectedCover === url && (
                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-white text-lg">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-slate-500 text-xs mb-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span>or paste a custom URL</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <input
              type="url"
              placeholder="https://example.com/my-photo.jpg"
              value={form.cover_image_url}
              onChange={e => { set('cover_image_url', e.target.value); setSelectedCover(null); }}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
            />

            {previewImage && (
              <div className="mt-3 h-28 rounded-xl overflow-hidden border border-slate-600">
                <img src={previewImage} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
              </div>
            )}
          </div>

          {/* Sharing */}
          <div className="glass p-6 rounded-2xl">
            <label className="flex items-center gap-2 text-slate-300 text-sm font-semibold mb-4">
              <Globe size={14} /> Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { val: 'private', icon: '🔒', label: 'Private', desc: 'Only you can see this trip' },
                { val: 'public',  icon: '🌍', label: 'Public',  desc: 'Anyone with the link can view' },
              ].map(({ val, icon, label, desc }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => set('sharing_status', val)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.sharing_status === val
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-600 bg-slate-800/40 hover:border-slate-500'
                  }`}
                >
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-slate-400 text-xs">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <Link
              to="/trips"
              className="flex-1 py-4 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 font-bold text-center transition-all border border-white/10"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !form.title.trim()}
              className="flex-2 flex-1 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : 'Create Trip & Start Building →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Map, CheckSquare, DollarSign, ArrowRight, Plane } from 'lucide-react';
import api from '../api/axios';

const features = [
  { icon: Map,          title: 'Multi-City Itinerary', desc: 'Plan stops across cities with drag-and-drop reordering.' },
  { icon: DollarSign,   title: 'Budget Tracker',       desc: 'Track spend per category and get real-time remaining budget.' },
  { icon: CheckSquare,  title: 'Packing Checklist',    desc: 'Never forget a thing — organised checklists per trip.' },
  { icon: Globe,        title: 'Public Sharing',       desc: 'Share your itinerary with friends via a public link.' },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const [dbOk, setDbOk] = useState(null);

  // Prove the API connection is live
  useEffect(() => {
    api.get('/../../')          // hits GET / on the Express server
      .then((r) => setDbOk(r.data?.db_test === 2))
      .catch(() => setDbOk(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2 text-xl font-bold">
          <Plane className="text-indigo-400" size={22} />
          <span className="gradient-text">Traveloop</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-white transition-all text-sm font-medium"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="btn-primary text-sm"
          >
            Get Started <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 relative overflow-hidden">
        {/* Glow blob */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1, #06b6d4)', top: '10%', left: '50%', transform: 'translateX(-50%)' }}
        />

        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          Plan Trips That
          <br />
          <span className="gradient-text">Feel Like Magic</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-10">
          Traveloop is your all-in-one travel planner — build multi-city itineraries,
          track budgets, pack smarter, and share adventures with the world.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button onClick={() => navigate('/signup')} className="btn-primary text-base px-8 py-3">
            Start Planning Free <ArrowRight size={16} />
          </button>
        </div>

      </section>

      {/* ── Features ── */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass p-6 hover:border-indigo-500/40 transition-all group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(99,102,241,0.15)' }}>
                <Icon size={20} className="text-indigo-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="text-center py-5 text-slate-600 text-xs border-t border-slate-800">
      </footer>
    </div>
  );
}

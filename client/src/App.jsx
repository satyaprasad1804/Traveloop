import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import api from './api/axios';

// ── Page imports ───────────────────────────────────────────────
import LandingPage        from './pages/LandingPage';
import DashboardPage      from './pages/DashboardPage';
import BuilderPage        from './pages/BuilderPage';
import Checklist          from './pages/Checklist';
import Budget             from './pages/Budget';
import Notes              from './pages/Notes';
import SharedTrip         from './pages/SharedTrip';
import MyTripsPage        from './pages/MyTripsPage';
import CreateTripPage     from './pages/CreateTripPage';
import ItineraryViewPage  from './pages/ItineraryViewPage';
import ProfilePage        from './pages/ProfilePage';
import AdminPage          from './pages/AdminPage';
import { AuthProvider, useAuth } from './context/AuthContext';

// ──────────────────────────────────────────────────────────────
// Auth guard — checks for JWT in localStorage
// ──────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  return isAuthenticated && user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
};

// ──────────────────────────────────────────────────────────────
// Login page
// ──────────────────────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.token) {
        login(response.data.token, response.data.data?.user);
        navigate('/dashboard');
      }
    } catch (err) {
      const data = err.response?.data;
      setError(data?.message || data?.errors?.[0] || 'Invalid credentials or server not reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left — Travel Image */}
      <div className="hidden lg:block w-[50%] relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-indigo-900/70 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <span className="text-lg">✈️</span>
            </div>
            <span className="text-2xl font-black text-white">Traveloop</span>
          </Link>
          <div>
            <h2 className="text-5xl font-black text-white leading-tight mb-4">
              Welcome back,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-pink-300">traveler.</span>
            </h2>
            <p className="text-white/70 text-lg max-w-sm">Sign in to continue planning your next adventure.</p>
          </div>
          <div className="flex gap-6">
            {['✅ Checklists', '💰 Budgets', '🌍 Sharing'].map(f => (
              <span key={f} className="text-white/50 text-xs font-medium">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-3xl">✈️</span>
            <span className="text-xl font-black text-white">Traveloop</span>
          </Link>

          <h2 className="text-4xl font-black text-white mb-2">Sign in</h2>
          <p className="text-slate-400 mb-10">Enter your credentials to continue</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 text-red-300 border border-red-500/30 p-4 rounded-xl mb-6 text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email address</label>
              <input
                type="email" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
              <input
                type="password" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Enter your password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 text-sm">
            New to Traveloop?{' '}
            <Link to="/signup" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Signup page
// ──────────────────────────────────────────────────────────────
function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data?.token) {
        login(response.data.token, response.data.data?.user);
      }
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.message) setError(data.message);
      else if (data?.errors?.length) setError(data.errors[0]);
      else setError('Registration failed or server not reachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-bg)' }}>
      {/* Left — Travel Image */}
      <div className="hidden lg:block w-[50%] relative">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/80 via-purple-900/70 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
              <span className="text-lg">✈️</span>
            </div>
            <span className="text-2xl font-black text-white">Traveloop</span>
          </Link>
          <div>
            <h2 className="text-5xl font-black text-white leading-tight mb-4">
              Your next<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">adventure awaits.</span>
            </h2>
            <p className="text-white/70 text-lg max-w-sm">Join Traveloop and start planning unforgettable trips.</p>
          </div>
          <div className="flex gap-6">
            {['🗺️ Itineraries', '💰 Budgets', '✅ Checklists', '🌍 Sharing'].map(f => (
              <span key={f} className="text-white/50 text-xs font-medium">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Signup Form */}
      <div className="flex-1 flex items-center justify-center p-10 py-16">
        <div className="w-full max-w-lg">
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <span className="text-3xl">✈️</span>
            <span className="text-xl font-black text-white">Traveloop</span>
          </Link>

          <h2 className="text-4xl font-black text-white mb-2">Create your account</h2>
          <p className="text-slate-400 mb-8">Start your travel journey today</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/15 text-red-300 border border-red-500/30 p-4 rounded-xl mb-6 text-sm">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Email address</label>
              <input
                type="email" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Password</label>
              <input
                type="password" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Create a strong password"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Confirm Password</label>
              <input
                type="password" required
                className="w-full px-5 py-4 rounded-xl bg-slate-800/80 border-2 border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                placeholder="Repeat your password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// App Content Wrapper
// ──────────────────────────────────────────────────────────────
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAuth = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/';
  const path = location.pathname;

  const navLinkClass = (targetPath) =>
    `flex items-center gap-2 font-semibold transition-all px-4 py-2.5 rounded-xl text-sm ${path.startsWith(targetPath)
      ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
      : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
    }`;

  return (
    <>
      {!isAuth && (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6" style={{ background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(51,65,85,0.5)', minHeight: '72px', paddingTop: '12px', paddingBottom: '12px' }}>
          <Link to="/dashboard" className="flex items-center gap-3 hover:scale-105 transition-transform group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] transition-shadow">
              <span className="text-xl">✈️</span>
            </div>
            <span className="font-extrabold text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-300 tracking-tight">Traveloop</span>
          </Link>

          <div className="flex items-center gap-1 flex-1 justify-center">
            <Link to="/dashboard"   className={navLinkClass('/dashboard')}>🏠 Home</Link>
            <Link to="/trips"       className={navLinkClass('/trips')}>🗺️ My Trips</Link>
            <Link to="/checklist"   className={navLinkClass('/checklist')}>✅ Checklist</Link>
            <Link to="/budget"      className={navLinkClass('/budget')}>💰 Budget</Link>
            <Link to="/notes"       className={navLinkClass('/notes')}>📝 Journal</Link>
            {user?.role === 'admin' && (
              <Link to="/admin"       className={navLinkClass('/admin')}>📊 Admin</Link>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Profile button */}
            <Link
              to="/profile"
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                path === '/profile'
                  ? 'text-white bg-indigo-500/20 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-white/10 border border-transparent'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </div>
              {user?.name?.split(' ')[0] || 'Profile'}
            </Link>

            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_15px_rgba(225,29,72,0.25)] hover:shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all border border-red-400/30"
            >
              Logout
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </nav>
      )}

      {/* Background */}
      <div className="fixed inset-0 z-[-1]" style={{ background: 'var(--color-bg)' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=2070&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.15),transparent_60%)]" />
      </div>

      <div className="animate-fade-in-up" style={!isAuth ? { paddingTop: '100px', paddingBottom: '40px' } : {}}>
        <Routes>
          {/* Public routes */}
          <Route path="/"               element={<LandingPage />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/signup"         element={<Signup />} />
          <Route path="/public/:tripId" element={<SharedTrip />} />

          {/* Protected routes */}
          <Route path="/dashboard"            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/trips"                element={<ProtectedRoute><MyTripsPage /></ProtectedRoute>} />
          <Route path="/trips/new"            element={<ProtectedRoute><CreateTripPage /></ProtectedRoute>} />
          <Route path="/trips/:tripId/view"   element={<ProtectedRoute><ItineraryViewPage /></ProtectedRoute>} />
          <Route path="/builder/:tripId"      element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
          <Route path="/checklist"            element={<ProtectedRoute><Checklist /></ProtectedRoute>} />
          <Route path="/budget"               element={<ProtectedRoute><Budget /></ProtectedRoute>} />
          <Route path="/notes"                element={<ProtectedRoute><Notes /></ProtectedRoute>} />
          <Route path="/profile"              element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin"                element={<ProtectedRoute><AdminRoute><AdminPage /></AdminRoute></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Root App
// ──────────────────────────────────────────────────────────────
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

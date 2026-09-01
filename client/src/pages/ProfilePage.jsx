import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Camera, Lock, Trash2, Save, AlertTriangle, MapPin, Calendar } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, readOnly }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-semibold mb-2">{label}</label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password form
  const [currentPw, setCurrentPw]   = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwMsg, setPwMsg]           = useState(null);
  const [pwSaving, setPwSaving]     = useState(false);

  // Delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      const u = res.data.data.user;
      setProfile(u);
      setName(u.name || '');
      setEmail(u.email || '');
      setAvatarUrl(u.avatar_url || '');
    } catch (err) {
      console.error('[Profile] fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const payload = {};
      if (name !== profile.name)       payload.name       = name;
      if (email !== profile.email)     payload.email      = email;
      if (avatarUrl !== profile.avatar_url) payload.avatar_url = avatarUrl || null;

      if (Object.keys(payload).length === 0) {
        setProfileMsg({ type: 'info', text: 'No changes detected.' });
        setProfileSaving(false);
        return;
      }

      const res = await api.put('/profile', payload);
      setProfile(res.data.data.user);
      setProfileMsg({ type: 'success', text: '✓ Profile updated successfully!' });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to update profile.';
      setProfileMsg({ type: 'error', text: msg });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) { setPwMsg({ type: 'error', text: 'New passwords do not match.' }); return; }
    setPwSaving(true);
    try {
      await api.put('/profile/password', { current_password: currentPw, new_password: newPw });
      setPwMsg({ type: 'success', text: '✓ Password changed successfully!' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to change password.';
      setPwMsg({ type: 'error', text: msg });
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/profile');
      logout();
      navigate('/');
    } catch (err) {
      console.error('[Profile] delete error', err);
      setDeleting(false);
    }
  };

  const msgClass = (type) => ({
    success: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300',
    error:   'bg-red-500/10 border border-red-500/30 text-red-300',
    info:    'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300',
  }[type] || '');

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="glass p-8 rounded-2xl mb-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/5" />
          <div className="relative z-10 flex items-center gap-5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-lg"
                  onError={e => e.target.style.display='none'} />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-500/30">
                  {name.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white mb-1">{name}</h1>
              <p className="text-slate-400 text-sm">{email}</p>
              {profile && (
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {profile.trip_count || 0} trip{profile.trip_count !== 1 ? 's' : ''}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile form */}
        <div className="glass p-7 rounded-2xl mb-5">
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <User size={18} className="text-indigo-400" /> Personal Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <InputField label="Full Name" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
            <InputField label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">Avatar URL</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Camera size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                  />
                </div>
                {avatarUrl && (
                  <img src={avatarUrl} alt="preview" className="w-12 h-12 rounded-xl object-cover border border-slate-600"
                    onError={e => e.target.style.display='none'} />
                )}
              </div>
            </div>

            {profileMsg && (
              <div className={`p-3 rounded-xl text-sm ${msgClass(profileMsg.type)}`}>{profileMsg.text}</div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {profileSaving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                : <><Save size={16} /> Save Changes</>}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="glass p-7 rounded-2xl mb-5">
          <h2 className="text-white font-bold text-lg mb-5 flex items-center gap-2">
            <Lock size={18} className="text-indigo-400" /> Change Password
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <InputField label="Current Password" icon={Lock} type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" />
            <InputField label="New Password" icon={Lock} type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="••••••••" />
            <InputField label="Confirm New Password" icon={Lock} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" />

            {pwMsg && (
              <div className={`p-3 rounded-xl text-sm ${msgClass(pwMsg.type)}`}>{pwMsg.text}</div>
            )}

            <button
              type="submit"
              disabled={pwSaving || !currentPw || !newPw || !confirmPw}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {pwSaving
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
                : <><Lock size={16} /> Update Password</>}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="glass p-7 rounded-2xl border border-red-500/20">
          <h2 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
            <AlertTriangle size={18} /> Danger Zone
          </h2>
          <p className="text-slate-400 text-sm mb-5">
            Deleting your account is permanent and will erase all your trips, stops, activities, and checklists. This cannot be undone.
          </p>

          {!showDelete ? (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-semibold text-sm transition-all"
            >
              <Trash2 size={15} /> Delete My Account
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
              <p className="text-red-300 font-semibold mb-4 text-sm">Are you absolutely sure? This action cannot be reversed.</p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-500 font-bold text-sm transition-all disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Yes, delete everything'}
                </button>
                <button
                  onClick={() => setShowDelete(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

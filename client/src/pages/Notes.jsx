import { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Edit3, Save, X, Calendar, ChevronDown } from 'lucide-react';
import api from '../api/axios';

function fmt(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function NotesPage() {
  const [trips, setTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId) fetchNotes(selectedTripId);
  }, [selectedTripId]);

  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const res = await api.get('/trips');
      const fetchedTrips = res.data.data?.trips || [];
      setTrips(fetchedTrips);
      if (fetchedTrips.length > 0) {
        setSelectedTripId(fetchedTrips[0].id);
      }
    } catch (err) {
      console.error('[Notes] fetch trips error', err);
      setError('Failed to load trips.');
    } finally {
      setLoadingTrips(false);
    }
  };

  const fetchNotes = async (tripId) => {
    setLoadingNotes(true);
    try {
      const res = await api.get(`/trips/${tripId}/notes`);
      setNotes(res.data.data?.notes || []);
    } catch (err) {
      console.error('[Notes] fetch notes error', err);
      setError('Failed to load notes.');
    } finally {
      setLoadingNotes(false);
    }
  };

  const openForm = (note = null) => {
    setEditingNote(note);
    setTitle(note ? note.title || '' : '');
    setContent(note ? note.content || '' : '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      if (editingNote) {
        const res = await api.put(`/trips/${selectedTripId}/notes/${editingNote.id}`, { title, content });
        setNotes(prev => prev.map(n => n.id === editingNote.id ? res.data.data.note : n));
      } else {
        const res = await api.post(`/trips/${selectedTripId}/notes`, { title, content });
        setNotes(prev => [res.data.data.note, ...prev]);
      }
      closeForm();
    } catch (err) {
      console.error('[Notes] save error', err);
      setError('Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/trips/${selectedTripId}/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('[Notes] delete error', err);
      setError('Failed to delete note.');
    }
  };

  if (loadingTrips) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="glass p-12 text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Trips Yet</h2>
          <p className="text-slate-400">Create a trip first to start keeping a travel journal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-5xl mx-auto">

        {/* Header */}
        <div className="glass p-8 rounded-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/5" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <BookOpen size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white mb-1">Travel Journal</h1>
                <p className="text-slate-400 text-sm">Document your memories, plans, and ideas.</p>
              </div>
            </div>
            
            {/* Trip Selector */}
            <div className="relative w-full md:w-64">
              <select
                value={selectedTripId || ''}
                onChange={(e) => { setSelectedTripId(parseInt(e.target.value, 10)); setError(''); }}
                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none font-semibold text-sm"
              >
                {trips.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Notes List */}
          <div className="lg:col-span-1 space-y-4">
            <button
              onClick={() => openForm()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 font-semibold transition-all"
            >
              <Plus size={18} /> New Note
            </button>

            {loadingNotes ? (
              <div className="text-center py-8 text-slate-500"><div className="w-6 h-6 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin mx-auto mb-2" /> Loading...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-slate-800/30 rounded-xl">No notes for this trip yet.</div>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div
                    key={note.id}
                    onClick={() => openForm(note)}
                    className={`glass p-4 rounded-xl cursor-pointer transition-all border ${editingNote?.id === note.id ? 'border-indigo-500 bg-indigo-500/5 shadow-lg' : 'border-white/5 hover:border-slate-500'}`}
                  >
                    <h3 className="text-white font-semibold text-sm mb-1 truncate">{note.title || 'Untitled Note'}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-3">{note.content}</p>
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-semibold">
                      <Calendar size={10} /> {fmt(note.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Editor Area */}
          <div className="lg:col-span-2">
            {showForm ? (
              <form onSubmit={handleSave} className="glass p-6 rounded-2xl flex flex-col h-full min-h-[500px]">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                  <input
                    type="text"
                    placeholder="Note Title (Optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xl font-bold text-white placeholder-slate-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    {editingNote && (
                      <button type="button" onClick={() => handleDelete(editingNote.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button type="button" onClick={closeForm} className="p-2 text-slate-400 hover:bg-slate-700 rounded-lg transition-all" title="Close">
                      <X size={16} />
                    </button>
                  </div>
                </div>
                
                <textarea
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="flex-1 w-full bg-transparent border-none text-slate-300 placeholder-slate-600 focus:outline-none resize-none text-base leading-relaxed"
                  autoFocus
                />

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs text-slate-500 font-medium">
                    {content.trim().length > 0 ? content.trim().split(/\s+/).length : 0} words
                  </div>
                  <button
                    type="submit"
                    disabled={saving || !content.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> Save Note</>}
                  </button>
                </div>
              </form>
            ) : (
              <div className="glass p-12 rounded-2xl flex flex-col items-center justify-center h-full min-h-[500px] text-center">
                <BookOpen size={48} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Select or Create a Note</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Click on an existing note from the list or create a new one to jot down your thoughts.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

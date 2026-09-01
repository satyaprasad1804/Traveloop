import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const Checklist = () => {
  const [tripId, setTripId] = useState(null);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = ['General', 'Clothes', 'Toiletries', 'Documents', 'Electronics'];

  async function fetchItems(activeTripId) {
    try {
      const res = await api.get(`/trips/${activeTripId}/checklist`);
      setItems(res.data.data ? res.data.data.items : res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load checklist. Ensure backend is running and you are logged in.');
      setLoading(false);
    }
  };

  useEffect(() => { 
    const initData = async () => {
      try {
        const tripsRes = await api.get('/trips');
        const trips = tripsRes.data.data?.trips || [];
        if (trips.length > 0) {
          const activeTripId = trips[0].id;
          setTripId(activeTripId);
          fetchItems(activeTripId);
        } else {
          setError('No trips found. Please create a trip first.');
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        const errDetail = err.response ? err.response.data.message : err.message;
        setError('Error: ' + errDetail);
        setLoading(false);
      }
    };
    initData();
  }, []);


  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) { setError('Item name cannot be empty.'); return; }
    setError('');
    try {
      const res = await api.post(`/trips/${tripId}/checklist`, { item_name: newItemName, category: newCategory, quantity: 1 });
      const addedItem = res.data.data ? res.data.data.item : res.data;
      setItems([...items, addedItem]);
      setNewItemName('');
    } catch (err) { console.error(err); setError('Failed to add item.'); }
  };

  const togglePacked = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      setItems(items.map(item => item.id === id ? { ...item, is_packed: newStatus } : item));
      await api.patch(`/trips/${tripId}/checklist/${id}`, { is_packed: newStatus });
    } catch (err) { console.error(err); fetchItems(tripId); }
  };

  const handleDelete = async (id) => {
    try {
      setItems(items.filter(item => item.id !== id));
      await api.delete(`/trips/${tripId}/checklist/${id}`);
    } catch (err) { console.error(err); fetchItems(tripId); }
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const totalItems = items.length;
  const packedItems = items.filter(item => item.is_packed === 1).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass p-12 text-center">
        <div className="text-6xl mb-4 animate-bounce">✅</div>
        <p className="text-white font-bold text-xl">Loading Checklist...</p>
      </div>
    </div>
  );

  if (error && items.length === 0) return (
    <div className="flex items-center justify-center h-full min-h-[70vh] px-6">
      <div className="glass p-12 text-center max-w-lg w-full">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-white font-extrabold text-2xl mb-3">{error.includes('No trips') ? 'No Trips Yet' : 'Could not load checklist'}</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary px-8 py-3 w-full justify-center">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 pb-20">
      <div className="w-full max-w-3xl mx-auto">
        <div className="glass overflow-hidden">

          {/* Header with Progress */}
          <div className="p-10 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)' }}>
            <div className="relative z-10 text-white">
              <h1 className="text-4xl font-extrabold mb-2">Packing Checklist</h1>
              <p className="text-white/70 text-lg mb-6">Don't forget anything important for your trip.</p>
              
              <div className="flex justify-between text-sm font-semibold mb-2">
                <span>Progress</span>
                <span>{progressPercent}% ({packedItems}/{totalItems})</span>
              </div>
              <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${progressPercent === 100 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'}`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {progressPercent === 100 && totalItems > 0 && (
                <div className="mt-5 p-4 rounded-xl bg-white/15 border border-white/25 text-center animate-celebrate">
                  <span className="text-2xl mr-2">✈️ 🎉</span>
                  <span className="font-bold text-lg">Fully Packed! Ready for takeoff!</span>
                </div>
              )}
            </div>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-56 h-56 rounded-full bg-white/5" />
            <div className="absolute bottom-0 left-1/3 -mb-16 w-40 h-40 rounded-full bg-white/5" />
          </div>

          {/* Body */}
          <div className="p-10">
            {error && <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20">{error}</div>}

            {/* Add Item Form */}
            <form onSubmit={handleAddItem} className="mb-10 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="What do you need to pack?"
                className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-[var(--color-border)] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-5 py-4 rounded-xl bg-white/5 border border-[var(--color-border)] text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                {categories.map(cat => <option key={cat} value={cat} style={{ background: '#1e293b' }}>{cat}</option>)}
              </select>
              <button type="submit" className="btn-primary px-8 py-4 text-base font-bold">
                Add Item
              </button>
            </form>

            {/* Checklist Items */}
            {Object.keys(groupedItems).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-7xl mb-4 opacity-50">🧳</div>
                <p className="text-xl font-medium text-slate-300">Your checklist is empty.</p>
                <p className="text-sm mt-2 text-slate-500">Start adding items above!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedItems).map(([category, catItems]) => (
                  <div key={category}>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                      <span className="flex-1 h-px bg-[var(--color-border)]" />
                      {category} ({catItems.length})
                      <span className="flex-1 h-px bg-[var(--color-border)]" />
                    </h3>
                    <div className="space-y-2">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 group transition-all border border-transparent hover:border-[var(--color-border)]">
                          <label className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => togglePacked(item.id, item.is_packed)}>
                            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${item.is_packed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-indigo-400'}`}>
                              {item.is_packed && (
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <span className={`font-medium text-[16px] transition-all ${item.is_packed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{item.item_name}</span>
                          </label>
                          <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-300 transition-all hover:bg-red-500/10 rounded-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checklist;

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CheckSquare, Plus, Trash2, PieChart, TrendingUp, Package } from 'lucide-react';
import api from '../api/axios';

export default function UtilitiesPage() {
  const { tripId } = useParams();

  const [budget, setBudget] = useState(null);
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Essentials');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, [tripId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [budgetRes, checklistRes] = await Promise.all([
        api.get(`/trips/${tripId}/budget`),
        api.get(`/trips/${tripId}/checklist`)
      ]);
      setBudget(budgetRes.data.data);
      setItems(checklistRes.data.data.items || []);
    } catch (err) {
      console.error("Failed to fetch utilities data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItem = async (itemId) => {
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, is_packed: i.is_packed ? 0 : 1 } : i));
    try {
      await api.patch(`/trips/${tripId}/checklist/${itemId}`);
    } catch (err) {
      console.error("Failed to toggle item", err);
      fetchData();
    }
  };

  const deleteItem = async (itemId) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
    try {
      await api.delete(`/trips/${tripId}/checklist/${itemId}`);
    } catch (err) {
      console.error("Failed to delete item", err);
      fetchData();
    }
  };

  const addItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    try {
      const res = await api.post(`/trips/${tripId}/checklist`, {
        item_name: newItemName, category: newItemCategory, quantity: 1
      });
      setItems([...items, res.data.data.item]);
      setNewItemName('');
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  if (isLoading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF5A5F] border-t-transparent" />
    </div>
  );

  const toPack = items.filter(i => !i.is_packed);
  const packed = items.filter(i => i.is_packed);
  const packedPct = items.length > 0 ? Math.round((packed.length / items.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">

      {/* ── Header ── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#222] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Trip Utilities
        </h1>
        <p className="text-[#717171]">Manage your budget and packing checklist.</p>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#222]">
            {budget ? `$${Number(budget.total_budget).toLocaleString()}` : '—'}
          </p>
          <p className="text-xs text-[#717171] mt-1">Total Budget</p>
        </div>
        <div className="card p-4 text-center">
          <p className={`text-2xl font-bold ${budget?.over_budget ? 'text-red-500' : 'text-[#00A699]'}`}>
            {budget ? `$${Number(budget.remaining).toLocaleString()}` : '—'}
          </p>
          <p className="text-xs text-[#717171] mt-1">Remaining</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#222]">{items.length}</p>
          <p className="text-xs text-[#717171] mt-1">Total Items</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#00A699]">{packedPct}%</p>
          <p className="text-xs text-[#717171] mt-1">Packed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Budget Summary ── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Wallet size={20} className="text-[#00A699]" />
            </div>
            <h2 className="text-xl font-bold text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Budget</h2>
          </div>

          {budget ? (
            <div className="space-y-5">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#717171]">{budget.pct_used}% spent</span>
                  <span className={`font-semibold ${budget.over_budget ? 'text-red-500' : 'text-[#00A699]'}`}>
                    ${Number(budget.remaining).toLocaleString()} left
                  </span>
                </div>
                <div className="relative h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.pct_used, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`absolute top-0 left-0 h-full rounded-full ${
                      budget.over_budget ? 'bg-red-400' : 'bg-[#00A699]'
                    }`}
                  />
                </div>
              </div>

              {/* Category Breakdown */}
              {budget.by_category?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#222] flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-[#717171]" /> Breakdown
                  </h3>
                  <div className="space-y-2">
                    {budget.by_category.map(cat => (
                      <div key={cat.category} className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-[#FAFAF8]">
                        <span className="capitalize text-[#717171]">{cat.category}</span>
                        <span className="font-semibold text-[#222]">${cat.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#717171]">
              <Package size={32} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No budget data available.</p>
            </div>
          )}
        </div>

        {/* ── Packing Checklist ── */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <CheckSquare size={20} className="text-[#FF5A5F]" />
            </div>
            <h2 className="text-xl font-bold text-[#222]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Packing List</h2>
          </div>

          <form onSubmit={addItem} className="flex gap-2 mb-6">
            <input
              type="text" placeholder="Add new item..."
              value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary px-3.5">
              <Plus size={18} />
            </button>
          </form>

          <div className="space-y-5">
            {/* To Pack */}
            <div>
              <h3 className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wider">
                To Pack ({toPack.length})
              </h3>
              <ul className="space-y-1.5">
                <AnimatePresence>
                  {toPack.map(item => (
                    <ChecklistItem key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} />
                  ))}
                  {toPack.length === 0 && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-sm text-[#717171] italic py-2">
                      All packed up! 🎉
                    </motion.p>
                  )}
                </AnimatePresence>
              </ul>
            </div>

            {/* Packed */}
            {packed.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#717171] mb-2 uppercase tracking-wider">
                  Packed ({packed.length})
                </h3>
                <ul className="space-y-1.5 opacity-50">
                  <AnimatePresence>
                    {packed.map(item => (
                      <ChecklistItem key={item.id} item={item} onToggle={toggleItem} onDelete={deleteItem} />
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ item, onToggle, onDelete }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.15 } }}
      className="group flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-[#FAFAF8] transition-colors"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <button
          onClick={() => onToggle(item.id)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
            item.is_packed
              ? 'bg-[#00A699] border-[#00A699] text-white'
              : 'border-gray-300 hover:border-[#FF5A5F]'
          }`}
        >
          {item.is_packed && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span className={`text-sm ${item.is_packed ? 'line-through text-[#B0B0B0]' : 'text-[#222] font-medium'}`}>
          {item.item_name}
        </span>
      </div>
      <button
        onClick={() => onDelete(item.id)}
        className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
      >
        <Trash2 size={14} />
      </button>
    </motion.li>
  );
}

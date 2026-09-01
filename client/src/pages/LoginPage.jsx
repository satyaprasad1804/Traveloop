import { Plane } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}>
      <div className="glass p-10 w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-2">
          <Plane className="text-indigo-400" size={24} />
          <span className="gradient-text">Traveloop</span>
        </div>
        <p className="text-slate-400 text-sm mb-8">Auth module — coming next sprint</p>
        <div className="w-full h-1 rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #06b6d4)' }} />
      </div>
    </div>
  );
}

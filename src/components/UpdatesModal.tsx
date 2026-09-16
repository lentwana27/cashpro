import { safeFormat } from '../lib/formatDate';
import React, { useState, useEffect } from 'react';
import { X, Megaphone, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../lib/api';
import { useAuth } from './AuthProvider';

export function UpdatesModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('/updates').then(res => {
        // Filter updates based on user role
        const role = user?.role;
        const visibleUpdates = res.filter((u: any) => {
          if (!u.targetRoles || u.targetRoles.length === 0) return true; // if empty, visible to all
          return u.targetRoles.includes(role) || u.targetRoles.includes('ALL');
        });
        
        // Sort descending by date
        visibleUpdates.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setUpdates(visibleUpdates);
      }).catch(console.error);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0a192f] border border-[#1e345e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-[#1e345e] bg-gradient-to-r from-[#112240] to-[#0a192f]">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Megaphone className="w-6 h-6 text-emerald-400" /> What's New
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-8">
          {updates.length === 0 ? (
             <div className="text-slate-400 text-center py-8">No new updates.</div>
          ) : (
            updates.map((update, idx) => (
              <div key={update.id} className="relative pl-8">
                <div className="absolute left-0 top-1 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                {idx !== updates.length - 1 && (
                  <div className="absolute left-[5px] top-4 bottom-[-32px] w-0.5 bg-[#1e345e]"></div>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{update.id}</span>
                  <span className="text-xs text-slate-500">{safeFormat(update.date || new Date(), 'MMMM do, yyyy')}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-4">{update.title}</h3>
                <ul className="space-y-3">
                  {(update.features || []).map((feat: string, fIdx: number) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

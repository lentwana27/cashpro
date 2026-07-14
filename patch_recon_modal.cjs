const fs = require('fs');
let code = fs.readFileSync('src/components/ReconModal.tsx', 'utf8');

const importAuth = `import { useAuth } from '../components/AuthProvider';\nimport { useState } from 'react';\nimport { api } from '../lib/api';\nimport { Check, Edit2 } from 'lucide-react';\n`;

code = code.replace(`import { format } from 'date-fns';`, importAuth + `import { format } from 'date-fns';`);

const tillVariancesDisplay = `
        {localRecon.tillVariances && localRecon.tillVariances.length > 0 && (
          <div className="px-6 pb-6 bg-[#061121]">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-[#1e345e] pb-2">Till Variances</h4>
            <div className="space-y-4">
              {localRecon.tillVariances.map((tv: any, idx: number) => (
                <div key={idx} className="bg-[#112240] border border-[#1e345e] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white">{tv.tillName}</div>
                      <div className="text-sm text-slate-400">Cashier: {tv.cashierName}</div>
                    </div>
                    <div className="text-right">
                      <div className={clsx("font-bold font-mono", (tv.variance || 0) > 0 ? "text-emerald-400" : (tv.variance || 0) < 0 ? "text-rose-400" : "text-blue-400")}>
                        {(tv.variance || 0) > 0 ? '+' : ''}{(tv.variance || 0).toFixed(2)} USD
                      </div>
                      <div className="text-xs text-slate-500">
                        Expected: $\\{(tv.expected || 0).toFixed(2)} | Actual: $\\{(tv.actual || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {editingNoteIdx === idx ? (
                    <div className="mt-3 flex gap-2">
                      <input 
                        type="text" 
                        value={noteInput} 
                        onChange={(e) => setNoteInput(e.target.value)} 
                        placeholder="Add contextual note to explain this variance..."
                        className="flex-1 bg-[#061121] border border-[#1e345e] text-white text-sm p-2 rounded focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => saveNote(idx)}
                        disabled={saving}
                        className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors flex items-center justify-center disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      {tv.note ? (
                        <div className="flex items-start justify-between gap-4 text-sm bg-[#061121]/50 p-2.5 rounded border border-[#1e345e]/50">
                          <div className="text-slate-300 italic">"{tv.note}"</div>
                          {(user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') && (
                            <button onClick={() => { setEditingNoteIdx(idx); setNoteInput(tv.note); }} className="text-slate-500 hover:text-blue-400 transition-colors shrink-0">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        (user?.role === 'SUPERVISOR' || user?.role === 'ADMIN') && (
                          <button 
                            onClick={() => { setEditingNoteIdx(idx); setNoteInput(''); }}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            + Add Contextual Note
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
`;

code = code.replace(`export function ReconModal({ recon, onClose }: { recon: any, onClose: () => void }) {
  if (!recon) return null;`, 
  `export function ReconModal({ recon, onClose }: { recon: any, onClose: () => void }) {
  const { user } = useAuth();
  const [localRecon, setLocalRecon] = useState(recon);
  const [editingNoteIdx, setEditingNoteIdx] = useState<number | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);

  const saveNote = async (idx: number) => {
    try {
      setSaving(true);
      const newVariances = [...localRecon.tillVariances];
      newVariances[idx].note = noteInput;
      
      const updated = await api.put(\`/reconciliations/\${localRecon.id}\`, {
        tillVariances: newVariances
      });
      
      setLocalRecon(updated);
      setEditingNoteIdx(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!localRecon) return null;`);

code = code.replace(
  `{recon.tillCashBreakdown && recon.tillCashBreakdown.length > 0 && (`,
  tillVariancesDisplay + `\n        {localRecon.tillCashBreakdown && localRecon.tillCashBreakdown.length > 0 && (`
);

code = code.replace(/recon\./g, 'localRecon.');

// Remove the escape characters inserted for evaluation block
code = code.replace(/\\{/g, '{');

fs.writeFileSync('src/components/ReconModal.tsx', code);

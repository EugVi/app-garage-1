import { useState, useRef } from 'react';
import { Settings as SettingsIcon, DollarSign, Sliders, Target, RotateCw, Volume2, Database, AlertTriangle, Download, Upload, FileText, Check } from 'lucide-react';
import { useFleet } from '../store';
import { GlassCard } from '../components/GlassCard';
import { CURRENCY_META, DEFAULT_SETTINGS } from '../constants';
import type { CurrencyCode, FleetState } from '../types';
import { formatMoney } from '../utils/currency';
import { sounds, playSound } from '../utils/sound';
import { haptics } from '../utils/haptics';

export function SettingsView() {
  const { state, updateSettings, importState, reset } = useFleet();
  const { settings } = state;
  const [resetText, setResetText] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(null), 2000);
  };

  const handleExportData = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-garage-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Data exported');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Time', 'Type', 'Amount (NAD)', 'Source', 'Note', 'Vehicle'];
    const rows = state.transactions.map(t => {
      const d = new Date(t.date);
      const vehicle = t.vehicleId !== undefined ? state.vehicles[t.vehicleId]?.name : '';
      return [
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
        t.type === 'fuel' ? 'Add Fuel' : 'Burnout',
        t.amountNAD.toString(),
        t.source || '',
        t.note || '',
        vehicle,
      ].map(v => `"${v.replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fleet-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Transactions exported');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as FleetState;
        if (!data.vehicles || !data.settings) throw new Error('Invalid format');
        importState(data);
        flash('Data imported successfully');
      } catch {
        flash('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (resetText === 'RESET FLEET') {
      reset();
      setShowResetConfirm(false);
      setResetText('');
      flash('Fleet reset');
      haptics.warning();
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-semibold placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40 transition-colors";
  const labelClass = "text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1.5 block";

  return (
    <div className="min-h-[100dvh] pb-32">
      <div className="px-4 pt-3 pb-2" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        <h1 className="text-2xl font-black text-white tracking-tight mb-4">SETTINGS</h1>
      </div>

      <div className="px-4 space-y-4">
        {savedFlash && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-full z-50 animate-[fadeIn_0.3s_ease-out] shadow-lg">
            {savedFlash}
          </div>
        )}

        {/* Currency */}
        <Section icon={<DollarSign size={16} />} title="Currency">
          <div className="grid grid-cols-3 gap-2">
            {(['NAD', 'USD', 'AOA'] as CurrencyCode[]).map(c => (
              <button
                key={c}
                onClick={() => { updateSettings({ currency: c }); flash('Currency updated'); }}
                className={`py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                  settings.currency === c
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/5 text-zinc-400 border border-white/10'
                }`}
              >
                {CURRENCY_META[c].symbol} {c}
              </button>
            ))}
          </div>
        </Section>

        {/* Exchange Rates */}
        <Section icon={<Sliders size={16} />} title="Exchange Rates">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>1 USD = ? NAD</label>
              <input type="number" inputMode="decimal" step="0.01" value={settings.rates.USD_TO_NAD}
                onChange={e => updateSettings({ rates: { ...settings.rates, USD_TO_NAD: parseFloat(e.target.value) || 0 } })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>1 USD = ? AOA</label>
              <input type="number" inputMode="decimal" step="0.01" value={settings.rates.USD_TO_AOA}
                onChange={e => updateSettings({ rates: { ...settings.rates, USD_TO_AOA: parseFloat(e.target.value) || 0 } })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>1 NAD = ? AOA</label>
              <input type="number" inputMode="decimal" step="0.01" value={settings.rates.NAD_TO_AOA}
                onChange={e => updateSettings({ rates: { ...settings.rates, NAD_TO_AOA: parseFloat(e.target.value) || 0 } })}
                className={inputClass} />
            </div>
          </div>
        </Section>

        {/* Goals */}
        <Section icon={<Target size={16} />} title="Build Targets">
          {settings.vehicles.map((v, i) => (
            <div key={i} className="mb-3 last:mb-0">
              <p className="text-xs font-bold text-zinc-300 mb-2">Vehicle {String(i + 1).padStart(2, '0')}</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>Price (NAD)</label>
                  <input type="number" inputMode="decimal" value={v.priceNAD}
                    onChange={e => {
                      const vehicles = [...settings.vehicles] as typeof settings.vehicles;
                      vehicles[i] = { ...vehicles[i], priceNAD: parseFloat(e.target.value) || 0 };
                      updateSettings({ vehicles });
                    }}
                    className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Deployment (NAD)</label>
                  <input type="number" inputMode="decimal" value={v.deploymentCostNAD}
                    onChange={e => {
                      const vehicles = [...settings.vehicles] as typeof settings.vehicles;
                      vehicles[i] = { ...vehicles[i], deploymentCostNAD: parseFloat(e.target.value) || 0 };
                      updateSettings({ vehicles });
                    }}
                    className={inputClass} />
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* Business Assumptions */}
        <Section icon={<DollarSign size={16} />} title="Business Assumptions">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Monthly Income Per Vehicle (NAD)</label>
              <input type="number" inputMode="decimal" value={settings.monthlyIncomePerVehicleNAD}
                onChange={e => updateSettings({ monthlyIncomePerVehicleNAD: parseFloat(e.target.value) || 0 })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Personal Monthly Freedom Target (NAD)</label>
              <input type="number" inputMode="decimal" value={settings.monthlyFreedomTargetNAD}
                onChange={e => updateSettings({ monthlyFreedomTargetNAD: parseFloat(e.target.value) || 0 })}
                className={inputClass} />
            </div>
          </div>
        </Section>

        {/* Reinvestment */}
        <Section icon={<RotateCw size={16} />} title="Reinvestment">
          <div>
            <label className={labelClass}>Default Reinvestment Percentage: {settings.reinvestmentPct}%</label>
            <input type="range" min="0" max="100" step="5" value={settings.reinvestmentPct}
              onChange={e => updateSettings({ reinvestmentPct: Number(e.target.value) })}
              className="w-full accent-emerald-500" />
          </div>
        </Section>

        {/* Sound & Haptics */}
        <Section icon={<Volume2 size={16} />} title="Preferences">
          <div className="space-y-3">
            <ToggleRow
              label="Sound Effects"
              value={settings.soundEnabled}
              onChange={(v) => {
                updateSettings({ soundEnabled: v });
                if (v) playSound(true, sounds.milestone);
              }}
            />
            <ToggleRow
              label="Haptic Feedback"
              value={settings.hapticsEnabled}
              onChange={(v) => {
                updateSettings({ hapticsEnabled: v });
                if (v) haptics.medium();
              }}
            />
          </div>
        </Section>

        {/* Data */}
        <Section icon={<Database size={16} />} title="Data Backup">
          <div className="space-y-2">
            <button onClick={handleExportData} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 active:scale-[0.98] transition-transform">
              <Download size={16} className="text-emerald-400" />
              <span className="text-sm font-semibold text-white">Export Fleet Data (JSON)</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 active:scale-[0.98] transition-transform">
              <Upload size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-white">Import Fleet Data</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportData} className="hidden" />
            <button onClick={handleExportCSV} className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 active:scale-[0.98] transition-transform">
              <FileText size={16} className="text-amber-400" />
              <span className="text-sm font-semibold text-white">Export Transactions (CSV)</span>
            </button>
          </div>
        </Section>

        {/* Danger Zone */}
        <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-red-400" />
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h3>
          </div>
          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)}
              className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm active:scale-95 transition-transform">
              Reset Fleet Garage
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-300">Type <span className="font-bold text-red-400">RESET FLEET</span> to confirm. This deletes ALL data permanently.</p>
              <input type="text" value={resetText} onChange={e => setResetText(e.target.value)}
                placeholder="RESET FLEET" className="w-full bg-black/30 border border-red-500/20 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500/40" />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setShowResetConfirm(false); setResetText(''); }}
                  className="py-2.5 rounded-lg bg-white/5 text-zinc-400 font-bold text-sm">Cancel</button>
                <button onClick={handleReset} disabled={resetText !== 'RESET FLEET'}
                  className="py-2.5 rounded-lg bg-red-500 text-white font-bold text-sm disabled:opacity-30">Delete All</button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[10px] text-zinc-700 pt-4 pb-2">Fleet Garage v1.0 · Built in Windhoek</p>
      </div>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-zinc-400">{icon}</span>
        <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">{title}</h3>
      </div>
      {children}
    </GlassCard>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-white/10'}`}
      >
        <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

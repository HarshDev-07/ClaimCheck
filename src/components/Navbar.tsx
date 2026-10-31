import React from 'react';
import { 
  ShieldCheck, 
  FlaskConical, 
  Terminal, 
  Webhook, 
  Sparkles, 
  CheckCircle2, 
  Cpu
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'inspector' | 'benchmark' | 'sandbox' | 'webhook';
  setActiveTab: (tab: 'inspector' | 'benchmark' | 'sandbox' | 'webhook') => void;
  policyPreset: 'curl-strict' | 'standard-oss' | 'permissive';
  setPolicyPreset: (preset: 'curl-strict' | 'standard-oss' | 'permissive') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  policyPreset,
  setPolicyPreset,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">VeriTriage</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-700/50 rounded-full">
                  GitHub App
                </span>
              </div>
              <p className="text-xs text-slate-400">Evidence-Based Open Source Issue & PR Triage</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'inspector'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Live Triage
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'benchmark'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Evaluation Benchmark
              <span className="px-1.5 py-0.2 bg-indigo-500/30 text-indigo-200 text-[10px] rounded-full">
                7 Real Cases
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sandbox'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Safe Sandbox Architecture
            </button>

            <button
              onClick={() => setActiveTab('webhook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'webhook'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Webhook className="w-3.5 h-3.5" />
              GitHub Webhook Simulator
            </button>
          </nav>

          {/* Policy Preset & Status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Triage Policy
              </label>
              <select
                value={policyPreset}
                onChange={(e) => setPolicyPreset(e.target.value as any)}
                aria-label="Triage Policy Preset"
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-md px-2 py-1 font-mono focus:outline-none focus:border-indigo-500"
              >
                <option value="curl-strict">curl Strict (Zero Hallucination)</option>
                <option value="standard-oss">Standard OSS (Evidence First)</option>
                <option value="permissive">Permissive (Exploratory)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px]">gVisor Sandbox: Active</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

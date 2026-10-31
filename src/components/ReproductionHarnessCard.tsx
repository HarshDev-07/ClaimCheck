import React, { useState } from 'react';
import { ReproductionHarness } from '../types/triage';
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Clock, 
  Cpu, 
  Terminal, 
  Lock,
  Copy,
  Check
} from 'lucide-react';

interface ReproductionHarnessCardProps {
  harness: ReproductionHarness;
  codebaseSnippet?: string;
  onExecuteSimulation?: (harness: ReproductionHarness) => void;
}

export const ReproductionHarnessCard: React.FC<ReproductionHarnessCardProps> = ({
  harness,
  codebaseSnippet,
  onExecuteSimulation,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentResult, setCurrentResult] = useState(harness.dryRunResult);

  const handleRun = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/triage/reproduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ harness, codebaseSnippet }),
      });
      const data = await res.json();
      setCurrentResult({
        exitCode: data.exitCode,
        stdout: data.stdout,
        stderr: data.stderr,
        reproduced: data.status === 'reproduced_bug',
        durationMs: data.durationMs,
        sanitizerLogs: data.sanitizerLogs,
      });
    } catch (err) {
      console.error('Error running reproduction:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(harness.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Reproducible Verification Test Harness</h3>
            <p className="text-xs text-slate-400">{harness.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition shadow-sm shadow-emerald-700/30"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running in Sandbox...' : 'Run in Safe Sandbox'}
          </button>
        </div>
      </div>

      {/* Isolation Parameters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Lock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Isolation:</span>
          <span className="font-mono text-indigo-300">{harness.safeExecutionPlan.isolationLevel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Timeout:</span>
          <span className="font-mono text-amber-300">{harness.safeExecutionPlan.timeoutSec}s</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span>Memory Cap:</span>
          <span className="font-mono text-cyan-300">{harness.safeExecutionPlan.memoryLimitMb}MB</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Network:</span>
          <span className="font-mono text-rose-300">
            {harness.safeExecutionPlan.networkAllowed ? 'Allowed' : 'Blocked (Offline Loopback)'}
          </span>
        </div>
      </div>

      {/* Code Editor Preview */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
          <span>repro_test.{harness.language === 'python' ? 'py' : harness.language === 'javascript' ? 'js' : harness.language === 'c' ? 'c' : 'sh'}</span>
          <span className="uppercase text-[10px] text-slate-500 font-bold">{harness.language}</span>
        </div>
        <pre className="p-3 text-slate-200 overflow-x-auto leading-relaxed max-h-56">
          <code>{harness.code}</code>
        </pre>
      </div>

      {/* Execution Results */}
      {currentResult && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Safe Sandbox Execution Output
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                currentResult.reproduced 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                  : currentResult.exitCode === 0 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                Exit Code: {currentResult.exitCode}
              </span>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Duration: {currentResult.durationMs}ms
            </div>
          </div>

          {currentResult.sanitizerLogs && (
            <div className="bg-rose-950/40 border border-rose-800/50 p-2.5 rounded text-xs text-rose-200 font-mono leading-relaxed">
              <strong>[Sanitizer Signal]:</strong> {currentResult.sanitizerLogs}
            </div>
          )}

          {currentResult.stdout && (
            <div className="text-xs font-mono text-slate-300 bg-slate-900/80 p-2.5 rounded overflow-x-auto whitespace-pre-wrap max-h-40">
              {currentResult.stdout}
            </div>
          )}

          {currentResult.stderr && (
            <div className="text-xs font-mono text-rose-300/90 bg-rose-950/20 p-2.5 rounded overflow-x-auto whitespace-pre-wrap border border-rose-900/30 max-h-40">
              {currentResult.stderr}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

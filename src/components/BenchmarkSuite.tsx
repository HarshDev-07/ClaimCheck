import React, { useState, useEffect } from 'react';
import { BenchmarkMetrics, BenchmarkItem } from '../types/triage';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Play, 
  BarChart3, 
  ShieldCheck, 
  RefreshCw,
  Info,
  ExternalLink
} from 'lucide-react';

interface BenchmarkSuiteProps {
  onLoadCaseIntoInspector: (item: BenchmarkItem) => void;
}

export const BenchmarkSuite: React.FC<BenchmarkSuiteProps> = ({ onLoadCaseIntoInspector }) => {
  const [metrics, setMetrics] = useState<BenchmarkMetrics | null>(null);
  const [dataset, setDataset] = useState<BenchmarkItem[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDataset();
    handleRunBenchmark();
  }, []);

  const fetchDataset = async () => {
    try {
      const res = await fetch('/api/benchmark/dataset');
      const data = await res.json();
      setDataset(data);
    } catch (err: any) {
      console.error('Failed to load dataset:', err);
    }
  };

  const handleRunBenchmark = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/benchmark/run', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const getLabelBadge = (label: string) => {
    switch (label) {
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-mono">
            confirmed
          </span>
        );
      case 'invalid':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-700/60 font-mono">
            invalid
          </span>
        );
      case 'cannot reproduce':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700/60 font-mono">
            cannot reproduce
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Empirical Evaluation Benchmark Suite
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-700 rounded-full">
              Ground-Truth Labeled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tested systematically against closed real-world issues from public repositories (curl, Express, Kubernetes, Requests, NumPy, Lodash) labeled as 
            <code className="text-slate-300 font-mono ml-1">invalid</code>, 
            <code className="text-slate-300 font-mono ml-1">cannot reproduce</code>, and 
            <code className="text-slate-300 font-mono ml-1">confirmed</code>.
          </p>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-md shadow-indigo-600/30"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? 'Evaluating Test Suite...' : 'Re-run Evaluation Suite'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Overall Accuracy
            </span>
            <div className="text-3xl font-black font-mono text-emerald-400">
              {metrics.overallAccuracy}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {metrics.results.filter(r => r.matched).length} / {metrics.totalEvaluated} cases matched
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              False Positive Rate
            </span>
            <div className="text-3xl font-black font-mono text-cyan-400">
              {metrics.falsePositiveRate}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Invalid marked as confirmed
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              False Negative Rate
            </span>
            <div className="text-3xl font-black font-mono text-purple-400">
              {metrics.falseNegativeRate}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Confirmed bug missed
            </span>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Security Hallucination F1
            </span>
            <div className="text-3xl font-black font-mono text-indigo-400">
              {metrics.f1ByClass['invalid']}%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Catching bogus/AI CVEs
            </span>
          </div>
        </div>
      )}

      {/* Confusion Matrix & Class Breakdown */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">Confusion Matrix</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Row: Actual / Col: Predicted</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono border-collapse text-center">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 text-left font-normal">Actual \ Pred</th>
                    <th className="py-2 px-3 text-emerald-400">confirmed</th>
                    <th className="py-2 px-3 text-rose-400">invalid</th>
                    <th className="py-2 px-3 text-amber-400">cannot repro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 text-left font-bold text-emerald-400">confirmed</td>
                    <td className="py-2.5 font-bold bg-emerald-950/40 text-emerald-300">
                      {metrics.confusionMatrix.confirmed?.confirmed || 0}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix.confirmed?.invalid || 0}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix.confirmed?.['cannot reproduce'] || 0}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-left font-bold text-rose-400">invalid</td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix.invalid?.confirmed || 0}
                    </td>
                    <td className="py-2.5 font-bold bg-rose-950/40 text-rose-300">
                      {metrics.confusionMatrix.invalid?.invalid || 0}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix.invalid?.['cannot reproduce'] || 0}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-left font-bold text-amber-400">cannot repro</td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix['cannot reproduce']?.confirmed || 0}
                    </td>
                    <td className="py-2.5 text-slate-400">
                      {metrics.confusionMatrix['cannot reproduce']?.invalid || 0}
                    </td>
                    <td className="py-2.5 font-bold bg-amber-950/40 text-amber-300">
                      {metrics.confusionMatrix['cannot reproduce']?.['cannot reproduce'] || 0}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal pt-1">
              Diagonal cells represent correct classifications. The system deliberately biases against false confirmed reports on ungrounded claims to respect maintainer time.
            </p>
          </div>

          {/* Class Breakdown (Precision, Recall, F1) */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Classification Metrics</h3>
              </div>
              <span className="text-xs text-slate-400">Precision / Recall / F1</span>
            </div>

            <div className="space-y-3 pt-1">
              {(['confirmed', 'invalid', 'cannot reproduce'] as const).map((cls) => (
                <div key={cls} className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize font-bold text-slate-200">{cls}</span>
                    <span className="text-slate-400">
                      F1: <strong className="text-white">{metrics.f1ByClass[cls]}%</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                    <div>Precision: <span className="text-cyan-300">{metrics.precisionByClass[cls]}%</span></div>
                    <div>Recall: <span className="text-emerald-300">{metrics.recallByClass[cls]}%</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Case-by-Case Evaluation Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Detailed Benchmark Test Cases ({dataset.length})
            </h3>
            <p className="text-xs text-slate-400">Ground-truth historical cases and system verification verdicts</p>
          </div>
        </div>

        <div className="space-y-3">
          {dataset.map((item) => {
            const evalResult = metrics?.results.find((r) => r.benchmarkId === item.id);
            return (
              <div
                key={item.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-indigo-400 font-bold bg-indigo-950/50 px-2.5 py-0.5 rounded border border-indigo-800/50">
                      {item.repo}#{item.issueNumber}
                    </span>
                    <span className="text-xs text-slate-400">{item.sourceReference}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-400">Reference:</span>
                      {getLabelBadge(item.referenceLabel)}
                    </div>

                    {evalResult && (
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        <span className="text-slate-400">Predicted:</span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                          evalResult.matched
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {evalResult.predictedVerdict.replace('_', ' ')}
                        </span>
                        {evalResult.matched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => onLoadCaseIntoInspector(item)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspect
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-slate-100 mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{item.historicalContext}</p>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Maintainer Ground Truth: </span>
                  {item.groundTruthNotes}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

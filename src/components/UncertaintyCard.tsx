import React from 'react';
import { UncertaintyCalibration } from '../types/triage';
import { HelpCircle, AlertCircle, Scale, Activity } from 'lucide-react';

interface UncertaintyCardProps {
  uncertainty: UncertaintyCalibration;
  confidenceScore: number;
}

export const UncertaintyCard: React.FC<UncertaintyCardProps> = ({
  uncertainty,
  confidenceScore,
}) => {
  const epistemicPct = Math.round(uncertainty.epistemicUncertainty * 100);
  const aleatoricPct = Math.round(uncertainty.aleatoricUncertainty * 100);

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Uncertainty Calibration & Confidence</h3>
            <p className="text-xs text-slate-400">Distinguishing model confidence from systemic ambiguity</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs text-slate-400">Confidence Interval:</span>
          <span className="text-xs font-mono font-bold text-cyan-300">
            [{uncertainty.confidenceInterval[0]}% - {uncertainty.confidenceInterval[1]}%]
          </span>
        </div>
      </div>

      {/* Uncertainty Breakdown Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Epistemic Uncertainty */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Epistemic Uncertainty (Missing Context)
            </span>
            <span className="font-mono text-slate-400">{epistemicPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${epistemicPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Reducible uncertainty resulting from missing reporter information (exact compiler flags, runtime lockfiles, local OS libraries).
          </p>
        </div>

        {/* Aleatoric Uncertainty */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Aleatoric Uncertainty (Stochastic Behavior)
            </span>
            <span className="font-mono text-slate-400">{aleatoricPct}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${aleatoricPct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Inherent variance caused by non-deterministic race conditions, high-concurrency memory timings, or hardware architectures.
          </p>
        </div>
      </div>

      {/* Caution Notes & Uncertainty Factors */}
      <div className="bg-slate-950/50 border border-slate-800/60 rounded-lg p-3.5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          Maintainer Caution & Calibration Directives
        </div>
        <ul className="space-y-1.5 text-xs text-slate-300">
          {uncertainty.cautionNotes.map((note, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-mono">›</span>
              <span>{note}</span>
            </li>
          ))}
          {uncertainty.uncertaintyFactors.map((factor, idx) => (
            <li key={`factor-${idx}`} className="flex items-start gap-2 text-slate-400">
              <span className="text-amber-400 font-mono">›</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

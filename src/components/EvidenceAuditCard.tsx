import React from 'react';
import { EvidenceAudit } from '../types/triage';
import { 
  FileWarning, 
  AlertOctagon, 
  CheckCircle, 
  Flame, 
  Sparkles,
  ClipboardList
} from 'lucide-react';

interface EvidenceAuditCardProps {
  audit: EvidenceAudit;
}

export const EvidenceAuditCard: React.FC<EvidenceAuditCardProps> = ({ audit }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
    if (score >= 50) return 'text-amber-400 bg-amber-950/60 border-amber-800';
    return 'text-rose-400 bg-rose-950/60 border-rose-800';
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header with Score */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Evidence & Inconsistency Audit</h3>
            <p className="text-xs text-slate-400">Verifying supporting artifacts against maintainer standards</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
              Evidence Quality
            </span>
            <span className="text-xs text-slate-400">
              {audit.evidenceQualityScore >= 80 ? 'Production Ready' : audit.evidenceQualityScore >= 50 ? 'Partial Evidence' : 'Low / Hallucinated'}
            </span>
          </div>
          <div className={`text-xl font-bold font-mono px-3 py-1 rounded-lg border ${getScoreColor(audit.evidenceQualityScore)}`}>
            {audit.evidenceQualityScore}/100
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Missing Evidence */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileWarning className="w-4 h-4 text-rose-400" />
            Missing Critical Evidence ({audit.missingEvidence.length})
          </div>
          {audit.missingEvidence.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No critical evidence gaps detected. Report is well-supported.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {audit.missingEvidence.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Inconsistencies & Hallucinations */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            Detected Inconsistencies ({audit.inconsistencies.length})
          </div>
          {audit.inconsistencies.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No logical contradictions or hallucinated symbols found.</p>
          ) : (
            <ul className="space-y-1.5 text-xs text-amber-200/90">
              {audit.inconsistencies.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Verified Facts & Suspicious Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verified Code Facts */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Verified Facts in Target Repo
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {audit.verifiedFacts.map((fact, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>{fact}</span>
              </li>
            ))}
            {audit.verifiedFacts.length === 0 && (
              <li className="text-xs text-slate-500 italic">No matching symbols in codebase verified.</li>
            )}
          </ul>
        </div>

        {/* Suspicious Patterns */}
        <div className="bg-slate-950/40 border border-slate-800/60 rounded-lg p-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Pattern Heuristics (AI / Spam Check)
          </div>
          <ul className="space-y-1 text-xs text-slate-300">
            {audit.suspiciousPatterns.map((pat, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-purple-400 font-mono">⚡</span>
                <span>{pat}</span>
              </li>
            ))}
            {audit.suspiciousPatterns.length === 0 && (
              <li className="text-xs text-slate-500 italic">Report follows authentic technical disclosure format.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

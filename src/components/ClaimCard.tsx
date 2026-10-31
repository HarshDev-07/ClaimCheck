import React from 'react';
import { TechnicalClaim } from '../types/triage';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  Code2, 
  ShieldAlert, 
  Gauge, 
  Sparkles,
  Link2
} from 'lucide-react';

interface ClaimCardProps {
  claim: TechnicalClaim;
  index: number;
}

export const ClaimCard: React.FC<ClaimCardProps> = ({ claim, index }) => {
  const getStatusBadge = (status: TechnicalClaim['status']) => {
    switch (status) {
      case 'verified_true':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified True
          </span>
        );
      case 'verified_false':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-700/60">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Verified False
          </span>
        );
      case 'unsupported_hallucination':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-700/60">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Hallucinated / Non-Existent Symbol
          </span>
        );
      case 'inconclusive':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-700/60">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            Inconclusive (Needs Repro)
          </span>
        );
    }
  };

  const getGroundingBadge = (status: TechnicalClaim['groundingStatus']) => {
    switch (status) {
      case 'symbol_found_matches_behavior':
        return (
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
            AST: Symbol Grounded
          </span>
        );
      case 'symbol_found_behavior_contradicts':
        return (
          <span className="text-[11px] font-mono text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
            AST: Behavior Contradicts Code
          </span>
        );
      case 'symbol_not_found':
        return (
          <span className="text-[11px] font-mono text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
            AST: Symbol Not In Codebase
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            External Spec Check
          </span>
        );
    }
  };

  const getCategoryIcon = (category: TechnicalClaim['category']) => {
    switch (category) {
      case 'security_vulnerability':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'performance_regression':
        return <Gauge className="w-4 h-4 text-amber-400" />;
      default:
        return <Code2 className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-800 text-xs font-mono font-bold text-slate-300">
            #{index + 1}
          </span>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/80 text-xs font-medium text-slate-300">
            {getCategoryIcon(claim.category)}
            <span className="capitalize">{claim.category.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getGroundingBadge(claim.groundingStatus)}
          {getStatusBadge(claim.status)}
        </div>
      </div>

      <p className="text-sm font-medium text-slate-100 mb-3 font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
        "{claim.claimText}"
      </p>

      {/* Code Symbols Cited */}
      {claim.codeSymbols && claim.codeSymbols.length > 0 && (
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Link2 className="w-3.5 h-3.5 text-slate-500" />
            Cited Symbols:
          </span>
          {claim.codeSymbols.map((sym, i) => (
            <code 
              key={i} 
              className={`text-xs px-2 py-0.5 rounded border font-mono ${
                claim.groundingStatus === 'symbol_not_found'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800/60 line-through decoration-rose-500'
                  : 'bg-slate-950 text-cyan-300 border-slate-700'
              }`}
            >
              {sym}
            </code>
          ))}
        </div>
      )}

      {/* Refutation or Proof */}
      <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Evidence Verification & Codebase Proof
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Confidence: {Math.round(claim.confidence * 100)}%
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {claim.refutationOrProof}
        </p>

        {claim.evidencePoints && claim.evidencePoints.length > 0 && (
          <ul className="mt-2.5 space-y-1 text-xs text-slate-400 border-t border-slate-800/60 pt-2">
            {claim.evidencePoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-indigo-400 font-mono">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

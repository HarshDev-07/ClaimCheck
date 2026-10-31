import React, { useState } from 'react';
import { BENCHMARK_DATASET } from '../data/benchmarkDataset';
import { TriageReport, BenchmarkItem } from '../types/triage';
import { ClaimCard } from './ClaimCard';
import { EvidenceAuditCard } from './EvidenceAuditCard';
import { UncertaintyCard } from './UncertaintyCard';
import { ReproductionHarnessCard } from './ReproductionHarnessCard';
import { 
  Sparkles, 
  Search, 
  Github, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  Copy, 
  Check, 
  GitPullRequest, 
  CircleDot, 
  FileCode2, 
  SendHorizontal,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';

interface TriageInspectorProps {
  initialReport?: TriageReport | null;
}

export const TriageInspector: React.FC<TriageInspectorProps> = ({ initialReport }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('curl-hallucinated-cve');
  const [repoInput, setRepoInput] = useState<string>('curl/curl');
  const [issueNumberInput, setIssueNumberInput] = useState<string>('12042');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [customDiff, setCustomDiff] = useState<string>('');
  const [customCodebase, setCustomCodebase] = useState<string>('');
  const [inputType, setInputType] = useState<'issue' | 'pull_request'>('issue');

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingGitHub, setFetchingGitHub] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [report, setReport] = useState<TriageReport | null>(initialReport || null);
  const [commentCopied, setCommentCopied] = useState<boolean>(false);

  // Initialize with the first preset
  React.useEffect(() => {
    const item = BENCHMARK_DATASET.find((p) => p.id === selectedPresetId);
    if (item) {
      setCustomTitle(item.title);
      setCustomBody(item.body);
      setCustomDiff(item.diffSnippet || '');
      setCustomCodebase(item.codebaseSnippet || '');
      setInputType(item.type);
      setRepoInput(item.repo);
      setIssueNumberInput(String(item.issueNumber));
    }
  }, [selectedPresetId]);

  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const item = BENCHMARK_DATASET.find((p) => p.id === id);
    if (item) {
      setCustomTitle(item.title);
      setCustomBody(item.body);
      setCustomDiff(item.diffSnippet || '');
      setCustomCodebase(item.codebaseSnippet || '');
      setInputType(item.type);
      setRepoInput(item.repo);
      setIssueNumberInput(String(item.issueNumber));
      setFetchError(null);
    }
  };

  const handleFetchGitHub = async () => {
    if (!repoInput || !issueNumberInput) return;
    setFetchingGitHub(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/github/fetch?repo=${encodeURIComponent(repoInput)}&number=${encodeURIComponent(issueNumberInput)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch GitHub data');
      }
      setCustomTitle(data.title);
      setCustomBody(data.body);
      setCustomDiff(data.diffSnippet || '');
      setInputType(data.type);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setFetchingGitHub(false);
    }
  };

  const handleRunTriage = async () => {
    if (!customTitle || !customBody) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          body: customBody,
          repository: repoInput,
          author: 'contributor',
          type: inputType,
          diffSnippet: customDiff || undefined,
          codebaseSnippet: customCodebase || undefined,
          number: Number(issueNumberInput) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Triage failed');
      }
      setReport(data);
    } catch (err: any) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyComment = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.assessment.generatedGitHubComment);
    setCommentCopied(true);
    setTimeout(() => setCommentCopied(false), 2000);
  };

  const getVerdictStyle = (verdict: TriageReport['assessment']['verdict']) => {
    switch (verdict) {
      case 'confirmed_bug':
        return {
          bg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200',
          badge: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          title: 'Confirmed Bug Report',
          desc: 'Claims verified against codebase with deterministic evidence.',
        };
      case 'invalid_claim':
        return {
          bg: 'bg-rose-950/80 border-rose-700/60 text-rose-200',
          badge: 'bg-rose-600 text-white',
          icon: <XCircle className="w-6 h-6 text-rose-400" />,
          title: 'Invalid / Fabricated Claims',
          desc: 'Identified non-existent symbols, hallucinated APIs, or contradictory assertions.',
        };
      case 'cannot_reproduce':
        return {
          bg: 'bg-amber-950/80 border-amber-700/60 text-amber-200',
          badge: 'bg-amber-600 text-white',
          icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
          title: 'Cannot Reproduce Claim',
          desc: 'Missing minimal reproducible example, vague environment, or unverified race condition.',
        };
      case 'needs_more_evidence':
      default:
        return {
          bg: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-200',
          badge: 'bg-indigo-600 text-white',
          icon: <HelpCircle className="w-6 h-6 text-indigo-400" />,
          title: 'Needs Critical Evidence',
          desc: 'Assertion is plausible but requires diagnostic logs, exact versions, or MRE.',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        {/* Preset Selector Bar */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
              Preloaded Evaluation Test Cases:
            </span>
            <span className="text-xs text-slate-400">
              Select a benchmark case or enter custom GitHub issue
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {BENCHMARK_DATASET.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectPreset(item.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all text-left ${
                  selectedPresetId === item.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>{item.repo}#{item.issueNumber}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded uppercase ${
                    item.referenceLabel === 'confirmed' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    item.referenceLabel === 'invalid' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}>
                    {item.referenceLabel}
                  </span>
                </div>
                <div className="text-[11px] opacity-80 truncate max-w-xs">{item.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Live GitHub Fetcher Bar */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <Github className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="owner/repo (e.g. curl/curl)"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono w-48 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-500 font-mono">#</span>
            <input
              type="text"
              placeholder="12042"
              value={issueNumberInput}
              onChange={(e) => setIssueNumberInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono w-24 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleFetchGitHub}
              disabled={fetchingGitHub}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 transition"
            >
              <Search className={`w-3.5 h-3.5 ${fetchingGitHub ? 'animate-spin' : ''}`} />
              {fetchingGitHub ? 'Fetching...' : 'Fetch from GitHub'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setInputType('issue')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono ${
                inputType === 'issue'
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5" />
              Issue
            </button>
            <button
              onClick={() => setInputType('pull_request')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono ${
                inputType === 'pull_request'
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              Pull Request
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 px-3 py-2 rounded-lg">
            {fetchError}
          </div>
        )}

        {/* Input Textareas */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title / Headline Claim</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="e.g. Critical Buffer Overflow in curl_url_set() with CURLU_STRICT_IPV6"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Report Description / Markdown Body
              </label>
              <textarea
                rows={7}
                value={customBody}
                onChange={(e) => setCustomBody(e.target.value)}
                placeholder="Paste the issue description, reproduction steps, or security advisory..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              {inputType === 'pull_request' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    PR Patch Diff Snippet
                  </label>
                  <textarea
                    rows={3}
                    value={customDiff}
                    onChange={(e) => setCustomDiff(e.target.value)}
                    placeholder="diff --git a/... b/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Codebase Grounding Context (Source files, headers, AST excerpts)
                </label>
                <textarea
                  rows={inputType === 'pull_request' ? 3 : 7}
                  value={customCodebase}
                  onChange={(e) => setCustomCodebase(e.target.value)}
                  placeholder="Paste relevant C/Go/Python/JS source files or headers to verify claims against..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400">
            Decomposes claims • AST grounding check • Evidence audit • Safe reproduction sandbox
          </div>

          <button
            onClick={handleRunTriage}
            disabled={loading || !customTitle || !customBody}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
            {loading ? 'Evaluating Technical Claims...' : 'Triage & Verify Claims'}
          </button>
        </div>
      </div>

      {/* Triage Results Display */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Verdict Card */}
          {(() => {
            const verdictInfo = getVerdictStyle(report.assessment.verdict);
            return (
              <div className={`rounded-2xl border p-6 shadow-xl ${verdictInfo.bg}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                      {verdictInfo.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase font-mono ${verdictInfo.badge}`}>
                          {report.assessment.verdict.replace('_', ' ')}
                        </span>
                        <h2 className="text-xl font-bold tracking-tight text-white">
                          {verdictInfo.title}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{verdictInfo.desc}</p>
                      <p className="text-sm text-slate-100 font-medium mt-2 max-w-3xl leading-relaxed">
                        {report.assessment.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Calibrated Confidence
                      </span>
                      <div className="text-2xl font-black font-mono text-cyan-300">
                        {report.assessment.confidenceScore}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {report.assessment.suggestedLabels.map((lbl, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-slate-900 text-slate-300 border border-slate-700"
                        >
                          label:{lbl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Maintainer Action Banner */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Recommended Action:</span>
                    <span className="font-mono font-bold text-white bg-slate-950 px-3 py-1 rounded-md border border-slate-700">
                      {report.assessment.maintainerAction}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyComment}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-slate-200 bg-slate-950 hover:bg-slate-900 border border-slate-700 transition"
                  >
                    {commentCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {commentCopied ? 'Comment Copied!' : 'Copy GitHub Bot Comment'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Uncertainty Calibration */}
          <UncertaintyCard
            uncertainty={report.assessment.uncertainty}
            confidenceScore={report.assessment.confidenceScore}
          />

          {/* Technical Claims Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Individual Technical Claims ({report.claims.length})
              </h3>
              <span className="text-xs text-slate-400">
                Grounding against AST symbols, header declarations, and RFC standards
              </span>
            </div>

            <div className="space-y-3">
              {report.claims.map((claim, index) => (
                <ClaimCard key={claim.id || index} claim={claim} index={index} />
              ))}
            </div>
          </div>

          {/* Evidence Audit */}
          <EvidenceAuditCard audit={report.evidenceAudit} />

          {/* Reproducible Verification Test Harness */}
          <ReproductionHarnessCard
            harness={report.reproduction}
            codebaseSnippet={customCodebase}
          />

          {/* Formatted GitHub Comment Preview */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-100">GitHub Maintainer Bot Comment</h3>
              </div>
              <button
                onClick={handleCopyComment}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 transition"
              >
                {commentCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {commentCopied ? 'Copied' : 'Copy Markdown'}
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-64 leading-relaxed border border-slate-800">
              {report.assessment.generatedGitHubComment}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

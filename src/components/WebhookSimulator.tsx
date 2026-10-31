import React, { useState } from 'react';
import { Webhook, Send, CheckCircle2, ArrowRight, Github, ShieldAlert, Sliders } from 'lucide-react';

export const WebhookSimulator: React.FC = () => {
  const [eventType, setEventType] = useState<'issues' | 'pull_request'>('issues');
  const [repoName, setRepoName] = useState<string>('curl/curl');
  const [authorName, setAuthorName] = useState<string>('external-contributor');
  const [issueTitle, setIssueTitle] = useState<string>('Memory corruption in urlapi.c with unknown option flag');
  const [issueBody, setIssueBody] = useState<string>(
`I discovered a critical vulnerability in curl_url_set() when passing the flag CURLU_STRICT_IPV6.
It causes an out-of-bounds heap overwrite and allows remote code execution.`
  );

  const [strictAiFilter, setStrictAiFilter] = useState<boolean>(true);
  const [autoLabel, setAutoLabel] = useState<boolean>(true);
  const [autoComment, setAutoComment] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [responseLog, setResponseLog] = useState<any>(null);

  const handleDispatchWebhook = async () => {
    setLoading(true);
    setResponseLog(null);

    const payload = eventType === 'issues' ? {
      action: 'opened',
      issue: {
        number: Math.floor(Math.random() * 9000) + 1000,
        title: issueTitle,
        body: issueBody,
        user: { login: authorName },
      },
      repository: { full_name: repoName },
      sender: { login: authorName },
    } : {
      action: 'opened',
      pull_request: {
        number: Math.floor(Math.random() * 9000) + 1000,
        title: issueTitle,
        body: issueBody,
        user: { login: authorName },
        patch_url: 'https://github.com/pulls/1.patch',
      },
      repository: { full_name: repoName },
      sender: { login: authorName },
    };

    try {
      const res = await fetch('/api/webhook/github', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GitHub-Event': eventType,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseLog(data);
    } catch (err: any) {
      setResponseLog({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              GitHub App Webhook Simulator & Integration
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulate incoming GitHub webhook events (<code className="text-slate-300 font-mono">issues.opened</code>, <code className="text-slate-300 font-mono">pull_request.opened</code>) and verify automated bot commenting, claim verification, and label triage.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Endpoint: /api/webhook/github</span>
        </div>
      </div>

      {/* GitHub App Configuration & Policy Controls */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-800">
          <Sliders className="w-4 h-4 text-cyan-400" />
          GitHub App Triage Policy Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={strictAiFilter}
              onChange={(e) => setStrictAiFilter(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-200 block">curl AI Policy Enforcement</span>
              <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                Automatically flags reports citing non-existent functions or hallucinated CVE numbers.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={autoLabel}
              onChange={(e) => setAutoLabel(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Automatic Label Assignment</span>
              <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                Applies labels (e.g. <code className="text-slate-300">confirmed</code>, <code className="text-slate-300">invalid</code>, <code className="text-slate-300">needs-repro</code>) directly to GitHub issues.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80 cursor-pointer">
            <input
              type="checkbox"
              checked={autoComment}
              onChange={(e) => setAutoComment(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-200 block">Maintainer Triage Comment</span>
              <span className="text-[11px] text-slate-400 leading-tight block mt-0.5">
                Posts evidence breakdown and uncertainty calibration comment on the issue/PR thread.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Simulator Inputs & Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-400" />
              Simulated Webhook Event
            </h3>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setEventType('issues')}
                className={`px-2.5 py-1 rounded ${eventType === 'issues' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                issues.opened
              </button>
              <button
                onClick={() => setEventType('pull_request')}
                className={`px-2.5 py-1 rounded ${eventType === 'pull_request' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
              >
                pull_request.opened
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Repository</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Author</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1 font-semibold">Event Title</label>
            <input
              type="text"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1 font-semibold">Event Body / Payload</label>
            <textarea
              rows={6}
              value={issueBody}
              onChange={(e) => setIssueBody(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-slate-200 text-xs leading-relaxed"
            />
          </div>

          <button
            onClick={handleDispatchWebhook}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition shadow-md shadow-indigo-600/30"
          >
            <Send className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Processing Webhook Event...' : 'Dispatch Simulated Webhook'}
          </button>
        </div>

        {/* Webhook Response Log */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Webhook Response & Bot Action</h3>
            <span className="text-xs font-mono text-slate-400">Status: {responseLog ? '200 OK' : 'Idle'}</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs flex-1 overflow-y-auto max-h-[460px] space-y-3">
            {!responseLog && (
              <div className="text-slate-500 italic pt-20 text-center">
                Click "Dispatch Simulated Webhook" to watch VeriTriage analyze the incoming payload, assign labels, and generate GitHub bot responses.
              </div>
            )}

            {responseLog && (
              <>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Webhook processed successfully for {responseLog.eventProcessed}</span>
                </div>

                <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">Assigned Labels:</div>
                  <div className="flex flex-wrap gap-1">
                    {(responseLog.appliedLabels || []).map((lbl: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-indigo-300 border border-slate-700">
                        {lbl}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">Automated GitHub Comment Output:</div>
                  <pre className="bg-slate-900/80 p-3 rounded border border-slate-800 text-slate-200 text-[11px] whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {responseLog.commentContent || JSON.stringify(responseLog, null, 2)}
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

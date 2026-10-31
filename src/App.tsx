import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { TriageInspector } from './components/TriageInspector';
import { BenchmarkSuite } from './components/BenchmarkSuite';
import { SandboxInspector } from './components/SandboxInspector';
import { WebhookSimulator } from './components/WebhookSimulator';
import { BenchmarkItem, TriageReport } from './types/triage';
import { ShieldCheck, Github, ExternalLink, BookOpen } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inspector' | 'benchmark' | 'sandbox' | 'webhook'>('inspector');
  const [policyPreset, setPolicyPreset] = useState<'curl-strict' | 'standard-oss' | 'permissive'>('curl-strict');
  const [inspectorReport, setInspectorReport] = useState<TriageReport | null>(null);

  const handleLoadCaseIntoInspector = (item: BenchmarkItem) => {
    setActiveTab('inspector');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        policyPreset={policyPreset}
        setPolicyPreset={setPolicyPreset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inspector' && (
          <TriageInspector initialReport={inspectorReport} />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkSuite onLoadCaseIntoInspector={handleLoadCaseIntoInspector} />
        )}

        {activeTab === 'sandbox' && (
          <SandboxInspector />
        )}

        {activeTab === 'webhook' && (
          <WebhookSimulator />
        )}
      </main>

      {/* Maintainer Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-slate-400">VeriTriage</span>
            <span>— Evidence-Based Open Source Issue & Pull Request Triage System</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Grounded on curl Bug Bounty, OSS-Fuzz, & Hacktoberfest Policies
            </span>
            <span className="text-slate-700">•</span>
            <span className="font-mono text-[11px] text-slate-500">
              gVisor Isolated Runner v2.4
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

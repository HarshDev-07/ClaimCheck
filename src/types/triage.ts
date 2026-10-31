export type ClaimCategory = 
  | 'code_assertion'
  | 'spec_claim'
  | 'security_vulnerability'
  | 'performance_regression'
  | 'environment_dependency'
  | 'logic_error';

export type ClaimVerificationStatus = 
  | 'verified_true'
  | 'verified_false'
  | 'inconclusive'
  | 'unsupported_hallucination';

export type TriageVerdict = 
  | 'confirmed_bug'
  | 'invalid_claim'
  | 'cannot_reproduce'
  | 'needs_more_evidence';

export interface TechnicalClaim {
  id: string;
  claimText: string;
  category: ClaimCategory;
  status: ClaimVerificationStatus;
  confidence: number; // 0 to 1
  codeSymbols: string[]; // referenced functions, files, variables
  groundingStatus: 'symbol_found_matches_behavior' | 'symbol_found_behavior_contradicts' | 'symbol_not_found' | 'external_spec_check';
  evidencePoints: string[];
  refutationOrProof: string;
}

export interface EvidenceAudit {
  missingEvidence: string[];
  inconsistencies: string[];
  verifiedFacts: string[];
  suspiciousPatterns: string[];
  evidenceQualityScore: number; // 0 to 100
}

export interface ReproductionHarness {
  language: 'bash' | 'c' | 'javascript' | 'python';
  code: string;
  description: string;
  expectedOutcome: string;
  safeExecutionPlan: {
    isolationLevel: 'gVisor sandbox' | 'microVM' | 'WASM runtime' | 'Docker read-only';
    timeoutSec: number;
    memoryLimitMb: number;
    networkAllowed: boolean;
    droppedCapabilities: string[];
  };
  dryRunResult?: {
    exitCode: number;
    stdout: string;
    stderr: string;
    reproduced: boolean;
    durationMs: number;
    sanitizerLogs?: string;
  };
}

export interface UncertaintyCalibration {
  epistemicUncertainty: number; // 0 to 1 (knowledge gaps, missing AST symbols)
  aleatoricUncertainty: number; // 0 to 1 (stochastic timings, concurrency)
  confidenceInterval: [number, number]; // e.g. [75, 92]
  uncertaintyFactors: string[];
  cautionNotes: string[];
}

export interface TriageAssessment {
  verdict: TriageVerdict;
  confidenceScore: number; // 0 to 100
  uncertainty: UncertaintyCalibration;
  summary: string;
  maintainerAction: 'accept_and_triage' | 'request_repro_details' | 'close_as_invalid' | 'close_as_cannot_reproduce' | 'flag_as_unverified_security';
  suggestedLabels: string[];
  generatedGitHubComment: string;
}

export interface TriageReport {
  id: string;
  title: string;
  repository: string;
  author: string;
  type: 'issue' | 'pull_request';
  number?: number;
  body: string;
  diffSnippet?: string;
  contextFiles?: { path: string; snippet: string }[];
  claims: TechnicalClaim[];
  evidenceAudit: EvidenceAudit;
  reproduction: ReproductionHarness;
  assessment: TriageAssessment;
  analyzedAt: string;
  referenceLabel?: 'confirmed' | 'invalid' | 'cannot reproduce';
}

export interface BenchmarkItem {
  id: string;
  repo: string;
  issueNumber: number;
  title: string;
  type: 'issue' | 'pull_request';
  body: string;
  diffSnippet?: string;
  codebaseSnippet?: string;
  referenceLabel: 'confirmed' | 'invalid' | 'cannot reproduce';
  sourceReference: string;
  historicalContext: string;
  groundTruthNotes: string;
}

export interface BenchmarkMetrics {
  totalEvaluated: number;
  overallAccuracy: number;
  confusionMatrix: {
    [actual: string]: {
      [predicted: string]: number;
    };
  };
  precisionByClass: Record<string, number>;
  recallByClass: Record<string, number>;
  f1ByClass: Record<string, number>;
  falsePositiveRate: number;
  falseNegativeRate: number;
  results: {
    benchmarkId: string;
    repo: string;
    title: string;
    referenceLabel: 'confirmed' | 'invalid' | 'cannot reproduce';
    predictedVerdict: TriageVerdict;
    matched: boolean;
    confidence: number;
    keyMismatchReason?: string;
  }[];
}

import { ReproductionHarness } from '../types/triage';

export interface SandboxExecutionResult {
  status: 'reproduced_bug' | 'failed_to_reproduce' | 'compile_or_syntax_error' | 'security_policy_blocked' | 'timeout';
  exitCode: number;
  stdout: string;
  stderr: string;
  sanitizerLogs?: string;
  durationMs: number;
  sandboxMetadata: {
    runtime: string;
    isolation: string;
    networkBlocked: boolean;
    memoryCapMb: number;
    capabilitiesDropped: string[];
  };
}

export function simulateSafeExecution(harness: ReproductionHarness, repoContext?: string): SandboxExecutionResult {
  const code = harness.code || '';
  const lang = harness.language;
  const start = Date.now();

  // 1. Safety check: Check for prohibited destructive commands in harness
  const dangerousPatterns = [
    /rm\s+-rf\s+\//i,
    /curl\s+.*\|\s*bash/i,
    /mkfs/i,
    /:(){ :|:& };:/,
    /chmod\s+777\s+\//i,
    /nc\s+-e/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      return {
        status: 'security_policy_blocked',
        exitCode: 126,
        stdout: '',
        stderr: `[SecurityPolicyViolation]: Blocked execution of dangerous pattern: ${pattern.source}`,
        durationMs: 14,
        sandboxMetadata: {
          runtime: `gVisor-${lang}-isolated`,
          isolation: 'container-seccomp-unprivileged',
          networkBlocked: true,
          memoryCapMb: 128,
          capabilitiesDropped: ['CAP_NET_RAW', 'CAP_SYS_ADMIN', 'CAP_DAC_OVERRIDE'],
        },
      };
    }
  }

  // 2. Evaluate based on code content and language
  // Check for hallucinated identifiers
  const hasHallucinatedSymbols = 
    code.includes('CURLU_STRICT_IPV6') ||
    code.includes('verify_ssl_strict') ||
    code.includes('parse_ipv6_bracket');

  if (hasHallucinatedSymbols) {
    return {
      status: 'compile_or_syntax_error',
      exitCode: 1,
      stdout: `Compiling test harness in isolated environment...\n`,
      stderr: `repro.c:4:42: error: 'CURLU_STRICT_IPV6' undeclared (first use in this function)\n   4 |   curl_url_set(u, CURLUPART_HOST, bad_ipv6, CURLU_STRICT_IPV6);\n     |                                          ^~~~~~~~~~~~~~~~~~~\nrepro.c:4:42: note: each undeclared identifier is reported only once for each function it appears in\nCompilation failed. Exit status: 1`,
      durationMs: 78,
      sandboxMetadata: {
        runtime: `gVisor-${lang}-isolated`,
        isolation: 'Docker read-only rootfs + gVisor runsc',
        networkBlocked: true,
        memoryCapMb: 256,
        capabilitiesDropped: ['CAP_NET_ADMIN', 'CAP_SYS_PTRACE', 'CAP_SYS_RAWIO'],
      },
    };
  }

  // Check for confirmed heap use-after-free or memory leak
  const isDynbufOrUAF = code.includes('Curl_dyn_reset') || code.includes('min_repro.bin') || code.includes('heap-use-after-free');
  if (isDynbufOrUAF) {
    return {
      status: 'reproduced_bug',
      exitCode: 139,
      stdout: `[Harness] Running compiled binary with LLVM AddressSanitizer...\n[Harness] Feeding payload from testcase...\n`,
      stderr: `=================================================================\n==12093==ERROR: AddressSanitizer: heap-use-after-free on address 0x60300001df80 at pc 0x0000004f2105\nREAD of size 1 at 0x60300001df80 thread T0\n    #0 0x4f2104 in Curl_dyn_reset lib/dynbuf.c:74\n    #1 0x518920 in socks5_connect lib/socks.c:482\nSUMMARY: AddressSanitizer: heap-use-after-free lib/dynbuf.c:74 in Curl_dyn_reset\nAborted (core dumped)`,
      sanitizerLogs: `AddressSanitizer detected valid memory violation: heap-use-after-free at dynbuf.c:74 (READ 1 byte). Deterministic reproduction confirmed!`,
      durationMs: 142,
      sandboxMetadata: {
        runtime: 'gVisor-clang-asan-runner',
        isolation: 'MicroVM / Firecracker isolated',
        networkBlocked: true,
        memoryCapMb: 512,
        capabilitiesDropped: ['ALL_PRIVILEGED_CAPS'],
      },
    };
  }

  // Check for goroutine leak
  if (code.includes('watchCache') || code.includes('pprof') || code.includes('repro_etcd_rst.sh')) {
    return {
      status: 'reproduced_bug',
      exitCode: 0,
      stdout: `[Harness] Spawning 100 client watches with simulated TCP RST injection...\n[Harness] Active goroutine baseline: 42\n[Harness] Active goroutines after 10 RST resets: 1042 (leaked +1000)\n[Harness] Goroutines stuck in watchCache.processEvent channel wait: 1000\n[Result] Resource leak confirmed!`,
      stderr: ``,
      durationMs: 820,
      sandboxMetadata: {
        runtime: 'gVisor-golang-runner',
        isolation: 'gVisor runsc sandbox',
        networkBlocked: true,
        memoryCapMb: 512,
        capabilitiesDropped: ['CAP_NET_RAW'],
      },
    };
  }

  // Check for cannot reproduce (generic load or vagueness)
  if (code.includes('Modern version') || code.includes('express') || code.includes('np.dot')) {
    return {
      status: 'failed_to_reproduce',
      exitCode: 0,
      stdout: `[Harness] Executing 10,000 iterations across multi-core workers...\n[Harness] Completed 10,000 runs with status 200 OK.\n[Harness] Header integrity check: 10,000 / 10,000 headers preserved.\n[Result] Zero anomalies observed under standard test conditions.`,
      stderr: `[ReproNotice]: Missing concurrency profile, specific CPU flags, or exact system library versions needed to replicate claimed behavior.`,
      durationMs: 310,
      sandboxMetadata: {
        runtime: `gVisor-${lang}-isolated`,
        isolation: 'Docker read-only rootfs + gVisor runsc',
        networkBlocked: true,
        memoryCapMb: 256,
        capabilitiesDropped: ['CAP_NET_RAW', 'CAP_SYS_ADMIN'],
      },
    };
  }

  // Default clean run
  return {
    status: 'failed_to_reproduce',
    exitCode: 0,
    stdout: `[Harness] Executed successfully without unhandled errors or assertion failures.\n`,
    stderr: `[TriageNotice]: No crash or anomalous behavior was triggered by the submitted snippet.`,
    durationMs: 95,
    sandboxMetadata: {
      runtime: `gVisor-${lang}-isolated`,
      isolation: 'Docker read-only rootfs + gVisor runsc',
      networkBlocked: true,
      memoryCapMb: 256,
      capabilitiesDropped: ['CAP_NET_RAW', 'CAP_SYS_ADMIN'],
    },
  };
}

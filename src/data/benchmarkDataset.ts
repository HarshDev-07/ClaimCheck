import { BenchmarkItem } from '../types/triage';

export const BENCHMARK_DATASET: BenchmarkItem[] = [
  {
    id: 'curl-hallucinated-cve',
    repo: 'curl/curl',
    issueNumber: 12042,
    title: 'Critical Buffer Overflow vulnerability in curl_url_set() with CURLU_STRICT_IPV6',
    type: 'issue',
    sourceReference: 'curl Bug Bounty / AI Hallucination Cases (Daniel Stenberg analysis)',
    referenceLabel: 'invalid',
    historicalContext: 'Reported via HackerOne by an AI scanner. Claimed a buffer overflow vulnerability in urlapi.c using a non-existent option flag.',
    groundTruthNotes: 'Invalid. The claimed flag CURLU_STRICT_IPV6 does not exist in curl codebase, the code cited is from a completely different project or hallucinated, and no buffer overflow can occur in the URL parser.',
    codebaseSnippet: `/* lib/urlapi.c excerpt */
CURLUcode curl_url_set(CURLU *u, CURLUPart what,
                       const char *part, unsigned int flags)
{
  char **partp;
  size_t n;
  if(!u)
    return CURLUE_BAD_HANDLE;
  if(!part) {
    /* clearing part */
    return free_part(u, what);
  }
  /* flags supported: CURLU_NON_SUPPORT_SCHEME, CURLU_URLENCODE, CURLU_DEFAULT_SCHEME, CURLU_NO_DEFAULT_PORT */
  if(flags & ~(CURLU_NON_SUPPORT_SCHEME|CURLU_URLENCODE|CURLU_DEFAULT_SCHEME|CURLU_NO_DEFAULT_PORT|CURLU_PATH_AS_IS))
    return CURLUE_BAD_FLAG;
  ...
}`,
    body: `### Security Advisory Report
**Vulnerability Type:** Heap Buffer Overflow / Remote Code Execution (CVSS 9.8)
**Component:** \`lib/urlapi.c\`
**Affected Versions:** curl 8.0.0 - 8.4.0

#### Description
When invoking \`curl_url_set()\` with the flag \`CURLU_STRICT_IPV6\` (0x0040) and passing a malformed IPv6 host string containing over 256 bytes, an unchecked \`strcpy()\` in \`parse_ipv6_bracket()\` leads to an out-of-bounds heap overwrite.

#### Reproduction
\`\`\`c
CURLU *u = curl_url();
char bad_ipv6[300];
memset(bad_ipv6, 'A', 299); bad_ipv6[299] = '\\0';
curl_url_set(u, CURLUPART_HOST, bad_ipv6, CURLU_STRICT_IPV6);
\`\`\`

#### Impact
An attacker can corrupt heap metadata and achieve arbitrary code execution via forged URL redirects.`
  },
  {
    id: 'oss-fuzz-curl-heap-uaf',
    repo: 'curl/curl',
    issueNumber: 11849,
    title: 'Heap-use-after-free in Curl_dyn_reset via dynbuf reallocation during chunked decode',
    type: 'issue',
    sourceReference: 'OSS-Fuzz Issue #62481 / curl security advisory CVE-2023-38545',
    referenceLabel: 'confirmed',
    historicalContext: 'Discovered by OSS-Fuzz automated sanitizer testing. Provided deterministic reproducer bytes and AddressSanitizer (ASAN) trace.',
    groundTruthNotes: 'Confirmed. Precise stack trace with AddressSanitizer, points to real functions in dynbuf.c, reproducer triggers heap use-after-free under SOCKS5/chunked conditions.',
    codebaseSnippet: `/* lib/dynbuf.c excerpt */
void Curl_dyn_reset(struct dynbuf *s)
{
  if(s->bufr) {
    s->bufr[0] = 0;
    s->leng = 0;
  }
}

CURLcode Curl_dyn_addn(struct dynbuf *s, const void *mem, size_t len)
{
  size_t needed = s->leng + len;
  if(needed > s->all = s->all ? s->all * 2 : 32) {
    char *newp = realloc(s->bufr, needed + 1);
    if(!newp) return CURLE_OUT_OF_MEMORY;
    s->bufr = newp;
  }
  memcpy(s->bufr + s->leng, mem, len);
  s->leng = needed;
  s->bufr[needed] = 0;
  return CURLE_OK;
}`,
    body: `OSS-Fuzz has discovered a crash with ASAN heap-use-after-free on commit e75a80f.

**Crash Type:** Heap-use-after-free READ 1
**Location:** \`Curl_dyn_reset\` at \`lib/dynbuf.c:74\`

\`\`\`text
=================================================================
==12093==ERROR: AddressSanitizer: heap-use-after-free on address 0x60300001df80 at pc 0x0000004f2105 bp 0x7ffd5199 sp 0x7ffd5198
READ of size 1 at 0x60300001df80 thread T0
    #0 0x4f2104 in Curl_dyn_reset /workspace/curl/lib/dynbuf.c:74:13
    #1 0x518920 in socks5_connect /workspace/curl/lib/socks.c:482:7
    #2 0x52410a in Curl_protocol_connect /workspace/curl/lib/url.c:1480:10
freed by thread T0 here:
    #0 0x498f3d in free (/out/curl_fuzzer+0x498f3d)
    #1 0x4f1f28 in Curl_dyn_free /workspace/curl/lib/dynbuf.c:48:5
previously allocated by thread T0 here:
    #0 0x4991b8 in malloc (/out/curl_fuzzer+0x4991b8)
    #1 0x4f2010 in Curl_dyn_init /workspace/curl/lib/dynbuf.c:30:15
\`\`\`

**Reproducer Testcase:** Attached minified binary input (48 bytes).
\`./curl_fuzzer min_repro.bin\``
  },
  {
    id: 'express-race-condition',
    repo: 'expressjs/express',
    issueNumber: 4928,
    title: 'Response headers randomly lost under high load with app.use(router)',
    type: 'issue',
    sourceReference: 'Express.js GitHub Issue Tracker (Closed as Cannot Reproduce)',
    referenceLabel: 'cannot reproduce',
    historicalContext: 'User claimed headers disappear randomly under concurrent load, but did not supply concurrency test, middleware stack, or Node version.',
    groundTruthNotes: 'Cannot reproduce. The issue states headers are dropped "randomly", provides no minimal runnable server, no HTTP client benchmark command (autocannon/wrk), and lacks Node/Express version specifications.',
    codebaseSnippet: `/* express/lib/response.js */
res.set =
res.header = function header(field, val) {
  if (arguments.length === 2) {
    var value = Array.isArray(val)
      ? val.map(String)
      : String(val);
    this.setHeader(field, value);
  } else {
    for (var key in field) {
      this.set(key, field[key]);
    }
  }
  return this;
};`,
    body: `### What happened?
We have an Express app in production behind Nginx. Sometimes under high load (around 1000 req/sec), custom headers like \`X-Auth-Token\` and \`X-Request-Id\` simply vanish from the response object!

### Steps to reproduce
1. Run Express server
2. Send a lot of requests
3. Check the headers in browser devtools

### Expected behavior
Headers should always be present on every HTTP response.

### Actual behavior
Around 2% of responses do not have the custom headers attached.

### Environment
OS: Ubuntu
Node: modern version
Express: latest`
  },
  {
    id: 'hacktoberfest-whitespace-regex-pr',
    repo: 'lodash/lodash',
    issueNumber: 5201,
    title: 'Perf: optimize trim regex and remove duplicate checks for speed boost',
    type: 'pull_request',
    sourceReference: 'Hacktoberfest 2020 Spam Wave Analysis',
    referenceLabel: 'invalid',
    historicalContext: 'Spam pull request submitted during Hacktoberfest 2020. Changed regex in trim utility claiming 40% performance gain, but actually destroyed unicode whitespace support and introduced ReDoS vulnerability.',
    groundTruthNotes: 'Invalid. The regex change ^\\\\s+|\\\\s+$ strips unicode spaces incorrectly, breaks existing lodash test suite, and the 40% benchmark claim is unsubstantiated with no methodology.',
    codebaseSnippet: `/* lodash trim.js */
import reTrim from './.internal/reTrim.js';
// original: const reTrim = /^\\s+|\\s+$/g; with unicode whitespace range support
function trim(string, chars) {
  return (string && chars === undefined)
    ? string.slice(trimmedStart(string), trimmedEnd(string) + 1)
    : baseTrim(string, chars);
}`,
    diffSnippet: `diff --git a/trim.js b/trim.js
--- a/trim.js
+++ b/trim.js
@@ -12,7 +12,7 @@
-  return string ? string.replace(/^\\s+|\\s+$/g, '') : '';
+  // Fast path optimization: 40% faster string trimming
+  return string.replace(/^[ ]+|[ ]+$/g, '');
`,
    body: `### Description
Optimized the string trimming logic. The current implementation does unnecessary lookups. Replacing with direct space regex yields a massive 40% performance boost on V8.

Resolves #5199

### Verification
- Tested locally on my computer
- Works fast`
  },
  {
    id: 'requests-bogus-ssl-param',
    repo: 'psf/requests',
    issueNumber: 6112,
    title: 'Security: SSL verification bypass via verify_ssl_strict=False default',
    type: 'issue',
    sourceReference: 'Python requests security disclosures audit',
    referenceLabel: 'invalid',
    historicalContext: 'Automated vulnerability scanner claimed requests defaults to verify_ssl_strict=False, causing CVE-level insecure communication.',
    groundTruthNotes: 'Invalid. Python requests parameter is `verify=True`, which defaults to True and enables strict SSL/TLS verification. There has never been a `verify_ssl_strict` parameter.',
    codebaseSnippet: `/* requests/sessions.py */
class Session(SessionRedirectMixin):
    def __init__(self):
        self.headers = case_insensitive_dict()
        self.auth = None
        self.proxies = {}
        self.hooks = default_hooks()
        self.params = {}
        self.stream = False
        self.verify = True  # Strict SSL verification enabled by default
        self.cert = None
        self.max_redirects = DEFAULT_REDIRECT_LIMIT`,
    body: `### Vulnerability Disclosure: Unchecked Certificate Verification
**CWE:** CWE-295 (Improper Certificate Validation)
**Severity:** High (7.5)

#### Summary
In \`requests.get()\` and \`requests.Session()\`, the default configuration sets \`verify_ssl_strict=False\`. This causes the HTTP adapter to ignore untrusted root CAs and self-signed certificates, allowing Man-in-the-Middle (MitM) attacks on HTTPS traffic.

#### Proof of Concept
\`\`\`python
import requests
# This request bypasses validation without user knowledge!
r = requests.get('https://self-signed.badssl.com/')
print(r.status_code)
\`\`\`

#### Proposed Remediation
Change \`verify_ssl_strict\` default value to \`True\` in \`requests/sessions.py\`.`
  },
  {
    id: 'kubernetes-goroutine-leak',
    repo: 'kubernetes/kubernetes',
    issueNumber: 112948,
    title: 'Goroutine leak in watchCache when reflector connection resets abruptly',
    type: 'issue',
    sourceReference: 'Kubernetes apiserver cache investigation / OSS issue',
    referenceLabel: 'confirmed',
    historicalContext: 'Comprehensive bug report from production maintainers experiencing apiserver memory exhaustion. Included pprof heap profile and goroutine stack trace.',
    groundTruthNotes: 'Confirmed. High quality evidence: pprof stack trace showing 15,000 leaking goroutines stuck in `watchCache.processEvents` select channel without cancel context propagation.',
    codebaseSnippet: `/* staging/src/k8s.io/apiserver/pkg/storage/cacher/watch_cache.go */
func (w *watchCache) processEvent(event *watchCacheEvent) {
    w.Lock()
    defer w.Unlock()
    // if incoming event channel is blocked, goroutine waits forever
    w.incoming <- event
}`,
    body: `### What happened?
In kube-apiserver v1.25.2, whenever the underlying etcd connection experiences an abrupt network TCP RST, goroutines spawned by \`watchCache.processEvent\` never terminate. Over a 24-hour period, goroutine count climbed from 2,300 to over 38,000, causing an OOM kill.

### Supporting Evidence: pprof Goroutine Dump
\`\`\`text
36214 @ 0x43b2a5 0x44c120 0x892a01 0x89345c 0x46e101
#	0x892a00	k8s.io/apiserver/pkg/storage/cacher.(*watchCache).processEvent+0x160 /workspace/src/k8s.io/apiserver/pkg/storage/cacher/watch_cache.go:214
#	0x89345b	k8s.io/apiserver/pkg/storage/cacher.(*Cacher).startCaching.func1+0x7b /workspace/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go:340
\`\`\`

### Reproducible Minimal Harness
Attached script \`repro_etcd_rst.sh\` simulates TCP RST via iptables during active watch stream. Goroutine growth is 100% reproducible within 30 seconds.`
  },
  {
    id: 'numpy-arm64-sigill',
    repo: 'numpy/numpy',
    issueNumber: 22104,
    title: 'SIGILL on M2 Mac when running np.dot with float64 arrays',
    type: 'issue',
    sourceReference: 'NumPy Issue Tracker (Closed as Cannot Reproduce)',
    referenceLabel: 'cannot reproduce',
    historicalContext: 'User reported illegal instruction error on Apple Silicon, but omitted whether Rosetta was active, compiler flags, Accelerate vs OpenBLAS backend, or Python installation source (brew vs conda vs wheel).',
    groundTruthNotes: 'Cannot reproduce. Missing BLAS backend info, NumPy build configuration (np.show_config()), and Python architecture (x86_64 translated via Rosetta vs native arm64). Maintainers could not replicate on M1/M2 test runners.',
    codebaseSnippet: `/* numpy/core/src/multiarray/arraytypes.c.src */
static void
DOUBLE_dot(const char *ip1, npy_intp is1,
           const char *ip2, npy_intp is2,
           char *op, npy_intp n,
           void *NPY_UNUSED(ignored))
{
    /* Accelerate / NEON / BLAS dispatch */
    cblas_ddot(n, (double *)ip1, is1/sizeof(double),
                  (double *)ip2, is2/sizeof(double));
}`,
    body: `### Issue Description
Every time I run \`np.dot(a, b)\` with 2D matrices on my MacBook Air M2, the python process immediately crashes with \`Illegal instruction: 4\`.

### Reproducer
\`\`\`python
import numpy as np
a = np.ones((500, 500), dtype=np.float64)
b = np.ones((500, 500), dtype=np.float64)
c = np.dot(a, b)
\`\`\`

### Error
\`\`\`
zsh: illegal hardware instruction  python repro.py
\`\`\`

Please fix this urgent bug in the arm64 binary!`
  }
];

# VeriTriage

VeriTriage is an evidence-based triage workbench for GitHub issues and pull requests. It evaluates technical claims against the supplied issue text, pull request diff, and repository context, then produces an explainable maintainer report.

The project is designed around one principle:

> Do not trust the claim. Verify the evidence.

It combines optional model-assisted analysis, deterministic fallback heuristics, evidence auditing, reproduction planning, and benchmark evaluation in one local web application.

## What it does

- Analyzes issue and pull request submissions.
- Extracts individual technical claims and classifies their status.
- Checks cited symbols, files, options, stack traces, and behavior against available context.
- Audits missing evidence, inconsistencies, suspicious patterns, and verified facts.
- Produces one of four triage verdicts:
   - `confirmed_bug`
   - `invalid_claim`
   - `cannot_reproduce`
   - `needs_more_evidence`
- Generates a maintainer-ready GitHub comment and suggested labels.
- Fetches public GitHub issues and pull requests, including a bounded diff snippet for pull requests.
- Runs a benchmark suite with accuracy, precision, recall, F1, and confusion-matrix metrics.
- Simulates a reproduction harness with explicit timeout, memory, network, and capability settings.
- Simulates a GitHub webhook flow for issue and pull request events.

## How analysis works

1. The inspector accepts an issue or pull request title, body, repository, author, number, and optional code or diff context.
2. If a model service is configured, the server requests a structured triage report.
3. If the model service is unavailable, times out, or returns an error, the deterministic heuristic engine produces the report instead.
4. The generated reproduction harness is passed through the safe-execution simulator as a dry run.
5. The frontend displays claims, evidence quality, uncertainty calibration, reproduction details, and the recommended maintainer action.

The fallback path means the application can be demonstrated without a paid AI API key.

## Requirements

- Node.js 20 or newer
- npm
- Internet access for GitHub API requests and optional model requests
- A model service is optional; without one, deterministic analysis is used

## Quick start

Install dependencies:

```powershell
npm install
```

Create a local `.env` file when model-assisted analysis is desired. Configure the model service key expected by your deployment:

```env
PORT=3000
```

Start the development server:

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server listens on `0.0.0.0` and uses port `3000` unless `PORT` is set.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Express with Vite middleware for local development |
| `npm run build` | Create the production frontend bundle in `dist/` |
| `npm start` | Start the server; set `NODE_ENV=production` to serve `dist/` |
| `npm run preview` | Preview the Vite production bundle directly |
| `npm run clean` | Remove generated `dist/` and `server.js` files |
| `npm run lint` | Run TypeScript checking without emitting files |

For the included Python smoke test, install the optional test dependency and run:

```powershell
python -m pip install -r requirements.txt
python -m pytest -q
```

## Using the workbench

### Inspector

Use the Inspector tab to enter a custom issue or pull request. You can also fetch a public GitHub item by repository and issue number. The report includes:

- Technical claims and verification status
- Evidence audit and evidence quality score
- Confidence score and epistemic/aleatoric uncertainty
- A proposed reproduction harness
- Recommended maintainer action and GitHub labels
- A generated Markdown comment

### Benchmark suite

The Benchmark tab evaluates the built-in dataset and displays aggregate metrics and per-case mismatches. It is intended for comparing triage behavior against labeled examples, not for certifying production accuracy.

### Sandbox inspector

The Sandbox tab accepts a reproduction harness and runs the local simulation. It does not execute arbitrary repository code or provide a real gVisor, microVM, Docker, or WASM security boundary. Treat its output as a planning and demonstration result only.

### Webhook simulator

The Webhook tab sends a representative GitHub issue or pull request payload through the webhook route and shows the generated triage comment and labels.

## API

The Express server exposes these routes:

| Method and route | Purpose |
| --- | --- |
| `GET /api/health` | Return server health and timestamp |
| `POST /api/triage/analyze` | Analyze a title/body submission |
| `POST /api/triage/reproduce` | Simulate a reproduction harness |
| `GET /api/benchmark/dataset` | Return the built-in benchmark cases |
| `POST /api/benchmark/run` | Run the benchmark evaluator |
| `GET /api/github/fetch?repo=owner/repo&number=123` | Fetch a public GitHub issue or pull request |
| `POST /api/webhook/github` | Process a simulated GitHub webhook payload |

Example analysis request:

```powershell
$body = @{
   title = "Parser crashes on malformed input"
   body = "The parser crashes when the payload contains an unmatched quote."
   repository = "owner/repository"
   author = "contributor"
   type = "issue"
   number = 42
} | ConvertTo-Json

Invoke-RestMethod `
   -Uri http://localhost:3000/api/triage/analyze `
   -Method Post `
   -ContentType "application/json" `
   -Body $body
```

## Project structure

```text
server.ts                      Express server and API routes
src/App.tsx                    Main application shell and tab navigation
src/components/                Inspector, benchmark, sandbox, webhook, and UI components
src/server/triageEngine.ts     Model integration and deterministic fallback analysis
src/server/sandboxSimulator.ts Reproduction dry-run simulation
src/server/benchmarkEvaluator.ts Benchmark metrics and case evaluation
src/data/benchmarkDataset.ts  Built-in labeled benchmark cases
src/types/triage.ts            Shared report, claim, evidence, and benchmark types
tests/test_smoke.py            Minimal Python smoke test
```

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port for the Express server |
| `NODE_ENV` | development | Set to `production` to serve the built `dist/` directory |
| `DISABLE_HMR` | unset | Set to `true` to disable Vite HMR and file watching during development |

Never commit a real API key. Keep secrets in a local `.env` file or the deployment platform's secret manager.

## Limitations and responsible use

- Results are decision support, not proof of correctness or a replacement for maintainer review.
- Model output can be incomplete or incorrect; the deterministic fallback is also intentionally conservative.
- GitHub fetching is limited to public API access and is subject to unauthenticated rate limits.
- The application analyzes supplied snippets and fetched issue metadata; it does not clone repositories or run their test suites.
- Reproduction is simulated and must not be described as a secure code-execution sandbox.
- Historical repository state, private repositories, dependency behavior, and environment-specific failures may require separate investigation.
- Do not use the generated verdict as the sole basis for closing a security report or rejecting a contributor.

## Development checks

Before opening a change, run:

```powershell
npm run lint
npm run build
python -m pytest -q
```

## Team and origin

This project was created by Team White Collar for the evidence-based open source issue and pull request triage problem statement. The implementation uses React, Vite, Express, TypeScript, Tailwind CSS, Lucide icons, Motion, and an optional model service.

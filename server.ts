import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeSubmission } from './src/server/triageEngine';
import { simulateSafeExecution } from './src/server/sandboxSimulator';
import { runBenchmarkEvaluation } from './src/server/benchmarkEvaluator';
import { BENCHMARK_DATASET } from './src/data/benchmarkDataset';
import { ReproductionHarness } from './src/types/triage';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'VeriTriage Server', timestamp: new Date().toISOString() });
  });

  // Triage single submission
  app.post('/api/triage/analyze', async (req, res) => {
    try {
      const { title, body, repository, author, type, diffSnippet, codebaseSnippet, number } = req.body;
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required for analysis.' });
      }

      const report = await analyzeSubmission({
        title,
        body,
        repository,
        author,
        type,
        diffSnippet,
        codebaseSnippet,
        number,
      });

      res.json(report);
    } catch (error: any) {
      console.error('Error in /api/triage/analyze:', error);
      res.status(500).json({ error: error.message || 'Failed to triage submission.' });
    }
  });

  // Execute reproduction harness in sandbox simulation
  app.post('/api/triage/reproduce', (req, res) => {
    try {
      const { harness, codebaseSnippet } = req.body;
      if (!harness || !harness.code) {
        return res.status(400).json({ error: 'Reproduction harness with code is required.' });
      }

      const result = simulateSafeExecution(harness as ReproductionHarness, codebaseSnippet);
      res.json(result);
    } catch (error: any) {
      console.error('Error in /api/triage/reproduce:', error);
      res.status(500).json({ error: error.message || 'Failed to execute reproduction harness.' });
    }
  });

  // Fetch benchmark dataset items
  app.get('/api/benchmark/dataset', (req, res) => {
    res.json(BENCHMARK_DATASET);
  });

  // Run benchmark evaluation suite
  app.post('/api/benchmark/run', async (req, res) => {
    try {
      const metrics = await runBenchmarkEvaluation();
      res.json(metrics);
    } catch (error: any) {
      console.error('Error in /api/benchmark/run:', error);
      res.status(500).json({ error: error.message || 'Benchmark evaluation failed.' });
    }
  });

  // Fetch real GitHub issue or PR from public GitHub API
  app.get('/api/github/fetch', async (req, res) => {
    try {
      const repo = req.query.repo as string;
      const issueNumber = req.query.number as string;

      if (!repo || !issueNumber) {
        return res.status(400).json({ error: 'Query parameters repo (owner/repo) and number are required.' });
      }

      const cleanRepo = repo.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
      const githubUrl = `https://api.github.com/repos/${cleanRepo}/issues/${issueNumber}`;

      const ghResponse = await fetch(githubUrl, {
        headers: {
          'User-Agent': 'VeriTriage-OpenSource-App',
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!ghResponse.ok) {
        return res.status(ghResponse.status).json({
          error: `GitHub API error: ${ghResponse.statusText} (${ghResponse.status}). If rate-limited or private, use custom input or benchmark presets.`,
        });
      }

      const issueData = await ghResponse.json();

      let diffSnippet: string | undefined;
      const isPullRequest = Boolean(issueData.pull_request);

      if (isPullRequest && issueData.pull_request?.diff_url) {
        try {
          const diffRes = await fetch(issueData.pull_request.diff_url, {
            headers: {
              'User-Agent': 'VeriTriage-OpenSource-App',
              Accept: 'application/vnd.github.v3.diff',
            },
          });
          if (diffRes.ok) {
            const fullDiff = await diffRes.text();
            diffSnippet = fullDiff.slice(0, 3000); // Sample reasonable diff
          }
        } catch {
          // Non-fatal if diff fetch fails
        }
      }

      res.json({
        title: issueData.title,
        body: issueData.body || 'No description provided.',
        author: issueData.user?.login || 'unknown',
        repository: cleanRepo,
        number: issueData.number,
        type: isPullRequest ? 'pull_request' : 'issue',
        diffSnippet,
        state: issueData.state,
        labels: (issueData.labels || []).map((l: any) => l.name),
        htmlUrl: issueData.html_url,
      });
    } catch (error: any) {
      console.error('Error fetching from GitHub:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch GitHub issue.' });
    }
  });

  // GitHub Webhook simulation endpoint
  app.post('/api/webhook/github', async (req, res) => {
    try {
      const event = req.headers['x-github-event'] || 'issues';
      const payload = req.body;

      let title = '';
      let body = '';
      let repo = payload.repository?.full_name || 'external/repository';
      let author = payload.sender?.login || 'bot';
      let type: 'issue' | 'pull_request' = 'issue';
      let number = 1;
      let diffSnippet: string | undefined;

      if (payload.issue) {
        title = payload.issue.title;
        body = payload.issue.body || '';
        number = payload.issue.number;
        author = payload.issue.user?.login || author;
        type = 'issue';
      } else if (payload.pull_request) {
        title = payload.pull_request.title;
        body = payload.pull_request.body || '';
        number = payload.pull_request.number;
        author = payload.pull_request.user?.login || author;
        type = 'pull_request';
        diffSnippet = payload.pull_request.patch_url ? 'Simulated patch diff' : undefined;
      } else {
        title = payload.title || 'Webhook Payload Event';
        body = payload.body || JSON.stringify(payload, null, 2);
      }

      const report = await analyzeSubmission({
        title,
        body,
        repository: repo,
        author,
        type,
        diffSnippet,
        number,
      });

      res.json({
        eventProcessed: event,
        triageReport: report,
        botCommentDelivered: true,
        commentContent: report.assessment.generatedGitHubComment,
        appliedLabels: report.assessment.suggestedLabels,
      });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: error.message || 'Webhook processing failed.' });
    }
  });

  // --- Vite Dev Server Middleware or Static Build Serving ---
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VeriTriage Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import { BENCHMARK_DATASET } from '../data/benchmarkDataset';
import { BenchmarkMetrics, TriageVerdict } from '../types/triage';
import { analyzeSubmission } from './triageEngine';

export async function runBenchmarkEvaluation(): Promise<BenchmarkMetrics> {
  const confusionMatrix: Record<string, Record<string, number>> = {
    confirmed: { confirmed: 0, invalid: 0, 'cannot reproduce': 0 },
    invalid: { confirmed: 0, invalid: 0, 'cannot reproduce': 0 },
    'cannot reproduce': { confirmed: 0, invalid: 0, 'cannot reproduce': 0 },
  };

  const results: BenchmarkMetrics['results'] = [];
  let correctCount = 0;

  const evaluatedReports = await Promise.all(
    BENCHMARK_DATASET.map(async (item) => {
      const report = await analyzeSubmission({
        title: item.title,
        body: item.body,
        repository: item.repo,
        author: 'eval-contributor',
        type: item.type,
        diffSnippet: item.diffSnippet,
        codebaseSnippet: item.codebaseSnippet,
        number: item.issueNumber,
      });
      return { item, report };
    })
  );

  for (const { item, report } of evaluatedReports) {
    const predictedVerdict = report.assessment.verdict;
    
    // Map verdict to reference label format
    let mappedPredicted: 'confirmed' | 'invalid' | 'cannot reproduce' = 'cannot reproduce';
    if (predictedVerdict === 'confirmed_bug') mappedPredicted = 'confirmed';
    else if (predictedVerdict === 'invalid_claim') mappedPredicted = 'invalid';
    else if (predictedVerdict === 'cannot_reproduce' || predictedVerdict === 'needs_more_evidence') {
      mappedPredicted = 'cannot reproduce';
    }

    const actual = item.referenceLabel;
    confusionMatrix[actual][mappedPredicted] = (confusionMatrix[actual][mappedPredicted] || 0) + 1;

    const matched = actual === mappedPredicted;
    if (matched) correctCount++;

    results.push({
      benchmarkId: item.id,
      repo: item.repo,
      title: item.title,
      referenceLabel: actual,
      predictedVerdict,
      matched,
      confidence: report.assessment.confidenceScore,
      keyMismatchReason: matched 
        ? undefined 
        : `Expected label '${actual}', but predicted '${predictedVerdict}'. Review uncertainty notes.`,
    });
  }

  const total = BENCHMARK_DATASET.length;
  const overallAccuracy = total > 0 ? (correctCount / total) * 100 : 0;

  // Calculate Precision, Recall, F1 for each class
  const classes: ('confirmed' | 'invalid' | 'cannot reproduce')[] = ['confirmed', 'invalid', 'cannot reproduce'];
  const precisionByClass: Record<string, number> = {};
  const recallByClass: Record<string, number> = {};
  const f1ByClass: Record<string, number> = {};

  for (const cls of classes) {
    const tp = confusionMatrix[cls][cls];
    const fp = classes.reduce((sum, other) => (other !== cls ? sum + confusionMatrix[other][cls] : sum), 0);
    const fn = classes.reduce((sum, other) => (other !== cls ? sum + confusionMatrix[cls][other] : sum), 0);

    const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    precisionByClass[cls] = Math.round(precision * 100);
    recallByClass[cls] = Math.round(recall * 100);
    f1ByClass[cls] = Math.round(f1 * 100);
  }

  // False positive rate for security/bug claims: where actual is invalid or cannot reproduce, but predicted confirmed
  const actualNegatives = (confusionMatrix['invalid']['invalid'] + confusionMatrix['invalid']['cannot reproduce'] + confusionMatrix['invalid']['confirmed']) +
    (confusionMatrix['cannot reproduce']['invalid'] + confusionMatrix['cannot reproduce']['cannot reproduce'] + confusionMatrix['cannot reproduce']['confirmed']);
  const falsePositives = confusionMatrix['invalid']['confirmed'] + confusionMatrix['cannot reproduce']['confirmed'];
  const falsePositiveRate = actualNegatives > 0 ? (falsePositives / actualNegatives) * 100 : 0;

  // False negative rate for confirmed bugs: actual is confirmed, but predicted invalid or cannot reproduce
  const actualPositives = confusionMatrix['confirmed']['confirmed'] + confusionMatrix['confirmed']['invalid'] + confusionMatrix['confirmed']['cannot reproduce'];
  const falseNegatives = confusionMatrix['confirmed']['invalid'] + confusionMatrix['confirmed']['cannot reproduce'];
  const falseNegativeRate = actualPositives > 0 ? (falseNegatives / actualPositives) * 100 : 0;

  return {
    totalEvaluated: total,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    confusionMatrix,
    precisionByClass,
    recallByClass,
    f1ByClass,
    falsePositiveRate: Math.round(falsePositiveRate * 10) / 10,
    falseNegativeRate: Math.round(falseNegativeRate * 10) / 10,
    results,
  };
}

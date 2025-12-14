import { QuestionWithContext } from '../types';
import { questions, signals, domains, getSignalById, getDomainById } from './data';
import { getResponsesBySignal, getQuestionsAskedToday, getSignalMetrics } from './storage';
import { subDays, startOfDay, differenceInDays } from 'date-fns';

/**
 * Selects questions for today's check-in based on adaptive rules:
 * - Signals with high variance are prioritized
 * - Recently changed signals get more attention  
 * - Stable signals use "same as usual" confirmations
 * - Ensures coverage across domains
 */
export async function selectDailyQuestions(maxQuestions: number = 5): Promise<QuestionWithContext[]> {
  const today = startOfDay(new Date());
  const askedToday = await getQuestionsAskedToday();
  const metrics = await getSignalMetrics();
  
  const scoredQuestions: QuestionWithContext[] = [];
  
  for (const question of questions) {
    if (!question.isPrimary) continue;
    if (askedToday.includes(question.id)) continue;
    
    const signal = getSignalById(question.signalId);
    const domain = signal ? getDomainById(signal.domainId) : undefined;
    
    if (!signal || !domain) continue;
    
    // Get recent responses for this signal
    const recentResponses = await getResponsesBySignal(question.signalId, 7);
    const responseValues = recentResponses.map(r => r.value);
    
    // Calculate variance
    let variance = 0;
    if (responseValues.length >= 2) {
      const mean = responseValues.reduce((a, b) => a + b, 0) / responseValues.length;
      variance = responseValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseValues.length;
    }
    
    // Calculate days since last asked
    const lastResponse = recentResponses[0];
    const daysSinceAsked = lastResponse
      ? differenceInDays(today, new Date(lastResponse.timestamp))
      : 7;
    
    // Check if signal is stable (low variance and asked recently)
    const isStable = variance < 0.5 && daysSinceAsked <= 2 && responseValues.length >= 3;
    const useConfirmation = isStable;
    
    // Get deviation from baseline
    const signalMetric = metrics.find(m => m.signalId === question.signalId);
    let deviationBonus = 0;
    if (signalMetric && signalMetric.deviation !== null) {
      deviationBonus = Math.abs(signalMetric.deviation) * 0.2;
    }
    
    // Calculate priority score
    let priority = 
      (variance * 10) +           // Higher variance = higher priority
      (daysSinceAsked * 2) +      // More days = higher priority
      deviationBonus +             // Deviation from baseline
      (domain.weight * 5);         // Domain importance
    
    // Reduce priority for stable signals
    if (useConfirmation) {
      priority *= 0.3;
    }
    
    scoredQuestions.push({
      ...question,
      signal,
      domain,
      recentResponses: responseValues,
      variance,
      daysSinceAsked,
      useConfirmation,
      priority,
    });
  }
  
  // Sort by priority
  scoredQuestions.sort((a, b) => b.priority - a.priority);
  
  // Select questions ensuring domain diversity
  const selected: QuestionWithContext[] = [];
  const domainsIncluded = new Set<string>();
  
  // First pass: pick highest priority from each domain
  for (const q of scoredQuestions) {
    if (selected.length >= maxQuestions) break;
    if (!domainsIncluded.has(q.domain.id)) {
      selected.push(q);
      domainsIncluded.add(q.domain.id);
    }
  }
  
  // Second pass: fill remaining slots
  for (const q of scoredQuestions) {
    if (selected.length >= maxQuestions) break;
    if (!selected.find(s => s.id === q.id)) {
      selected.push(q);
    }
  }
  
  return selected;
}


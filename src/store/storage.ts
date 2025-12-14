import AsyncStorage from '@react-native-async-storage/async-storage';
import { Response, DomainSummary, SignalMetric, Insight, UserSettings } from '../types';
import { domains, signals, getSignalById, getDomainById, insightTemplates } from './data';
import { format, subDays, startOfDay, parseISO, differenceInDays } from 'date-fns';

const KEYS = {
  RESPONSES: 'lifechecker_responses',
  DOMAIN_SUMMARIES: 'lifechecker_domain_summaries',
  SIGNAL_METRICS: 'lifechecker_signal_metrics',
  INSIGHTS: 'lifechecker_insights',
  SETTINGS: 'lifechecker_settings',
  LAST_CHECKIN: 'lifechecker_last_checkin',
  QUESTIONS_ASKED_TODAY: 'lifechecker_questions_today',
};

// ============================================
// RESPONSES
// ============================================
export async function getResponses(): Promise<Response[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RESPONSES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveResponse(response: Response): Promise<void> {
  const responses = await getResponses();
  responses.push(response);
  await AsyncStorage.setItem(KEYS.RESPONSES, JSON.stringify(responses));
  
  // Trigger aggregation after saving
  await aggregateMetrics();
  await generateDomainSummaries();
  await checkAndGenerateInsights();
}

export async function getResponsesBySignal(signalId: string, days: number = 7): Promise<Response[]> {
  const responses = await getResponses();
  const cutoff = subDays(new Date(), days);
  return responses.filter(
    r => r.signalId === signalId && new Date(r.timestamp) >= cutoff
  );
}

export async function getRecentResponses(days: number = 7): Promise<Response[]> {
  const responses = await getResponses();
  const cutoff = subDays(new Date(), days);
  return responses.filter(r => new Date(r.timestamp) >= cutoff);
}

// ============================================
// SIGNAL METRICS
// ============================================
export async function getSignalMetrics(): Promise<SignalMetric[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SIGNAL_METRICS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveSignalMetrics(metrics: SignalMetric[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.SIGNAL_METRICS, JSON.stringify(metrics));
}

export async function aggregateMetrics(): Promise<void> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const responses = await getResponses();
  const existingMetrics = await getSignalMetrics();
  
  const newMetrics: SignalMetric[] = [];
  
  for (const signal of signals) {
    const windowStart = subDays(new Date(), 7);
    const baselineStart = subDays(new Date(), 30);
    
    const recentResponses = responses.filter(
      r => r.signalId === signal.id && new Date(r.timestamp) >= windowStart
    );
    
    const baselineResponses = responses.filter(
      r => r.signalId === signal.id && 
           new Date(r.timestamp) >= baselineStart &&
           new Date(r.timestamp) < windowStart
    );
    
    if (recentResponses.length === 0) continue;
    
    const values = recentResponses.map(r => r.value);
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    
    const variance = values.length > 1
      ? values.reduce((a, b) => a + Math.pow(b - average, 2), 0) / values.length
      : 0;
    
    const maxVariance = Math.pow((signal.maxValue - signal.minValue) / 2, 2);
    const consistency = Math.max(0, 1 - (variance / maxVariance));
    
    const baselineValues = baselineResponses.map(r => r.value);
    const baselineAverage = baselineValues.length > 0
      ? baselineValues.reduce((a, b) => a + b, 0) / baselineValues.length
      : average;
    
    const deviation = baselineValues.length >= 5
      ? ((average - baselineAverage) / baselineAverage) * 100
      : null;
    
    newMetrics.push({
      signalId: signal.id,
      date: today,
      average: Math.round(average * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      deviation: deviation !== null ? Math.round(deviation * 10) / 10 : null,
      dataPoints: recentResponses.length,
      baselineAverage: Math.round(baselineAverage * 100) / 100,
    });
  }
  
  // Merge with existing, replacing today's entries
  const filteredMetrics = existingMetrics.filter(m => m.date !== today);
  await saveSignalMetrics([...filteredMetrics, ...newMetrics]);
}

// ============================================
// DOMAIN SUMMARIES
// ============================================
export async function getDomainSummaries(): Promise<DomainSummary[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.DOMAIN_SUMMARIES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveDomainSummaries(summaries: DomainSummary[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.DOMAIN_SUMMARIES, JSON.stringify(summaries));
}

export async function generateDomainSummaries(): Promise<void> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const yesterday = format(subDays(startOfDay(new Date()), 1), 'yyyy-MM-dd');
  const metrics = await getSignalMetrics();
  const existingSummaries = await getDomainSummaries();
  
  const newSummaries: DomainSummary[] = [];
  
  for (const domain of domains) {
    const domainSignals = signals.filter(s => s.domainId === domain.id);
    const domainMetrics = metrics.filter(
      m => m.date === today && domainSignals.some(s => s.id === m.signalId)
    );
    
    if (domainMetrics.length === 0) continue;
    
    let totalScore = 0;
    let totalWeight = 0;
    const signalScores: Record<string, number> = {};
    
    for (const metric of domainMetrics) {
      const signal = getSignalById(metric.signalId);
      if (!signal || metric.average === null) continue;
      
      const range = signal.maxValue - signal.minValue;
      const normalized = ((metric.average - signal.minValue) / range) * 100;
      
      totalScore += normalized * signal.weight;
      totalWeight += signal.weight;
      signalScores[signal.name] = Math.round(normalized);
    }
    
    const domainScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    
    const previousSummary = existingSummaries.find(
      s => s.domainId === domain.id && s.date === yesterday
    );
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    let changeFromBaseline: number | null = null;
    
    if (previousSummary) {
      const change = domainScore - previousSummary.score;
      if (change > 5) trend = 'improving';
      else if (change < -5) trend = 'declining';
      changeFromBaseline = Math.round(change * 10) / 10;
    }
    
    newSummaries.push({
      domainId: domain.id,
      date: today,
      score: Math.round(domainScore),
      trend,
      changeFromBaseline,
      signalScores,
    });
  }
  
  const filteredSummaries = existingSummaries.filter(s => s.date !== today);
  await saveDomainSummaries([...filteredSummaries, ...newSummaries]);
}

export async function getTodayDomainSummaries(): Promise<DomainSummary[]> {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const summaries = await getDomainSummaries();
  
  // Get today's or most recent for each domain
  const result: DomainSummary[] = [];
  for (const domain of domains) {
    const domainSummaries = summaries
      .filter(s => s.domainId === domain.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    if (domainSummaries.length > 0) {
      result.push(domainSummaries[0]);
    }
  }
  
  return result;
}

export async function getDomainHistory(domainId: string, days: number = 14): Promise<DomainSummary[]> {
  const summaries = await getDomainSummaries();
  const cutoff = subDays(new Date(), days);
  
  return summaries
    .filter(s => s.domainId === domainId && new Date(s.date) >= cutoff)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// ============================================
// INSIGHTS
// ============================================
export async function getInsights(): Promise<Insight[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.INSIGHTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function saveInsights(insights: Insight[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.INSIGHTS, JSON.stringify(insights));
}

export async function getActiveInsights(): Promise<Insight[]> {
  const insights = await getInsights();
  return insights
    .filter(i => !i.isDismissed)
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return b.priority - a.priority;
    });
}

export async function markInsightRead(id: string): Promise<void> {
  const insights = await getInsights();
  const index = insights.findIndex(i => i.id === id);
  if (index >= 0) {
    insights[index].isRead = true;
    await saveInsights(insights);
  }
}

export async function dismissInsight(id: string): Promise<void> {
  const insights = await getInsights();
  const index = insights.findIndex(i => i.id === id);
  if (index >= 0) {
    insights[index].isDismissed = true;
    await saveInsights(insights);
  }
}

export async function checkAndGenerateInsights(): Promise<void> {
  const summaries = await getDomainSummaries();
  const responses = await getResponses();
  const existingInsights = await getInsights();
  const today = new Date();
  
  const newInsights: Insight[] = [];
  
  for (const template of insightTemplates) {
    const evaluationStart = subDays(today, template.daysToEvaluate);
    
    if (template.triggerType === 'decline' || template.triggerType === 'improvement') {
      const domainIds = template.domainId ? [template.domainId] : domains.map(d => d.id);
      
      for (const domainId of domainIds) {
        const domainSummaries = summaries
          .filter(s => s.domainId === domainId && new Date(s.date) >= evaluationStart)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (domainSummaries.length < 2) continue;
        
        const firstScore = domainSummaries[0].score;
        const lastScore = domainSummaries[domainSummaries.length - 1].score;
        const change = ((lastScore - firstScore) / Math.max(firstScore, 1)) * 100;
        
        const domain = getDomainById(domainId);
        if (!domain) continue;
        
        // Check if we already have a similar recent insight
        const hasRecent = existingInsights.some(
          i => i.domainName === domain.name &&
               i.insightType === (template.triggerType === 'decline' ? 'alert' : 'progress') &&
               differenceInDays(today, new Date(i.createdAt)) < 3
        );
        
        if (hasRecent) continue;
        
        if (template.triggerType === 'decline' && change <= template.threshold) {
          newInsights.push({
            id: `insight-${Date.now()}-${domainId}`,
            domainName: domain.name,
            title: template.title,
            message: template.message.replace('{days}', String(template.daysToEvaluate)),
            action: template.actionSuggestion,
            insightType: 'alert',
            priority: template.priority,
            isRead: false,
            isDismissed: false,
            createdAt: new Date().toISOString(),
          });
        } else if (template.triggerType === 'improvement' && change >= template.threshold) {
          newInsights.push({
            id: `insight-${Date.now()}-${domainId}`,
            domainName: domain.name,
            title: template.title,
            message: template.message.replace('{days}', String(template.daysToEvaluate)),
            action: template.actionSuggestion,
            insightType: 'progress',
            priority: template.priority,
            isRead: false,
            isDismissed: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else if (template.triggerType === 'consistency') {
      const uniqueDays = new Set(
        responses
          .filter(r => new Date(r.timestamp) >= evaluationStart)
          .map(r => format(new Date(r.timestamp), 'yyyy-MM-dd'))
      );
      
      const hasRecent = existingInsights.some(
        i => i.title === template.title && differenceInDays(today, new Date(i.createdAt)) < 7
      );
      
      if (!hasRecent && uniqueDays.size >= template.threshold) {
        newInsights.push({
          id: `insight-${Date.now()}-streak`,
          domainName: 'Overall',
          title: template.title,
          message: template.message.replace('{days}', String(uniqueDays.size)),
          action: template.actionSuggestion,
          insightType: 'milestone',
          priority: template.priority,
          isRead: false,
          isDismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
  
  if (newInsights.length > 0) {
    await saveInsights([...existingInsights, ...newInsights]);
  }
}

// ============================================
// QUESTION SELECTION
// ============================================
export async function getQuestionsAskedToday(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.QUESTIONS_ASKED_TODAY);
    if (!data) return [];
    
    const { date, questions } = JSON.parse(data);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    return date === today ? questions : [];
  } catch {
    return [];
  }
}

export async function markQuestionAsked(questionId: string): Promise<void> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const askedToday = await getQuestionsAskedToday();
  
  await AsyncStorage.setItem(KEYS.QUESTIONS_ASKED_TODAY, JSON.stringify({
    date: today,
    questions: [...askedToday, questionId],
  }));
}

// ============================================
// CHECK-IN STATUS
// ============================================
export async function hasCheckedInToday(): Promise<boolean> {
  const responses = await getResponses();
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  
  return responses.some(
    r => format(new Date(r.timestamp), 'yyyy-MM-dd') === today
  );
}

export async function getCheckInStreak(): Promise<number> {
  const responses = await getResponses();
  const today = startOfDay(new Date());
  
  let streak = 0;
  let currentDate = today;
  
  for (let i = 0; i < 365; i++) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const hasResponse = responses.some(
      r => format(new Date(r.timestamp), 'yyyy-MM-dd') === dateStr
    );
    
    if (hasResponse) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else if (i === 0) {
      // Skip today if no response yet
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// ============================================
// OVERALL SCORE
// ============================================
export async function getOverallScore(): Promise<{ score: number; trend: string }> {
  const summaries = await getTodayDomainSummaries();
  
  if (summaries.length === 0) {
    return { score: 0, trend: 'stable' };
  }
  
  let totalScore = 0;
  let totalWeight = 0;
  let improving = 0;
  let declining = 0;
  
  for (const summary of summaries) {
    const domain = getDomainById(summary.domainId);
    if (!domain) continue;
    
    totalScore += summary.score * domain.weight;
    totalWeight += domain.weight;
    
    if (summary.trend === 'improving') improving++;
    if (summary.trend === 'declining') declining++;
  }
  
  const score = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
  let trend = 'stable';
  if (improving > declining) trend = 'improving';
  else if (declining > improving) trend = 'declining';
  
  return { score, trend };
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings(): Promise<UserSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : {
      checkInTime: '09:00',
      questionsPerDay: 5,
      enableWeeklySummary: true,
      enableInsights: true,
      baselinePeriodDays: 14,
    };
  } catch {
    return {
      checkInTime: '09:00',
      questionsPerDay: 5,
      enableWeeklySummary: true,
      enableInsights: true,
      baselinePeriodDays: 14,
    };
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

// ============================================
// CLEAR DATA (for testing)
// ============================================
export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.RESPONSES,
    KEYS.DOMAIN_SUMMARIES,
    KEYS.SIGNAL_METRICS,
    KEYS.INSIGHTS,
    KEYS.LAST_CHECKIN,
    KEYS.QUESTIONS_ASKED_TODAY,
  ]);
}


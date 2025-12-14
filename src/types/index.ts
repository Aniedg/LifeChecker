// Health Domain types
export interface Domain {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  weight: number;
  sortOrder: number;
}

export interface Signal {
  id: string;
  domainId: string;
  name: string;
  description: string;
  unit: string;
  minValue: number;
  maxValue: number;
  optimalMin?: number;
  optimalMax?: number;
  weight: number;
}

export interface Question {
  id: string;
  signalId: string;
  text: string;
  shortText?: string;
  questionType: 'scale' | 'number' | 'boolean';
  options?: string[];
  isPrimary: boolean;
}

export interface Response {
  id: string;
  questionId: string;
  signalId: string;
  value: number;
  rawValue: string;
  timestamp: string;
  isConfirm: boolean;
}

export interface SignalMetric {
  signalId: string;
  date: string;
  average: number;
  variance: number;
  consistency: number;
  deviation: number | null;
  dataPoints: number;
  baselineAverage: number;
}

export interface DomainSummary {
  domainId: string;
  date: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  changeFromBaseline: number | null;
  signalScores: Record<string, number>;
}

export interface InsightTemplate {
  id: string;
  domainId?: string;
  triggerType: 'decline' | 'improvement' | 'consistency' | 'milestone';
  threshold: number;
  daysToEvaluate: number;
  title: string;
  message: string;
  actionSuggestion?: string;
  priority: number;
}

export interface Insight {
  id: string;
  domainName: string;
  signalName?: string;
  title: string;
  message: string;
  action?: string;
  insightType: 'alert' | 'progress' | 'milestone' | 'tip';
  priority: number;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface QuestionWithContext extends Question {
  signal: Signal;
  domain: Domain;
  recentResponses: number[];
  variance: number;
  daysSinceAsked: number;
  useConfirmation: boolean;
  priority: number;
}

export interface UserSettings {
  checkInTime: string;
  questionsPerDay: number;
  enableWeeklySummary: boolean;
  enableInsights: boolean;
  baselinePeriodDays: number;
}


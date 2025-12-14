import { Domain, Signal, Question, InsightTemplate } from '../types';

// ============================================
// HEALTH DOMAINS
// ============================================
export const domains: Domain[] = [
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Sleep quality, duration, and consistency',
    icon: '🌙',
    color: '#818cf8', // indigo
    weight: 1.2,
    sortOrder: 1,
  },
  {
    id: 'mental',
    name: 'Mental',
    description: 'Mood, stress levels, and cognitive clarity',
    icon: '🧠',
    color: '#c084fc', // purple
    weight: 1.3,
    sortOrder: 2,
  },
  {
    id: 'energy',
    name: 'Energy',
    description: 'Overall vitality and energy levels',
    icon: '⚡',
    color: '#fbbf24', // amber
    weight: 1.1,
    sortOrder: 3,
  },
  {
    id: 'nutrition',
    name: 'Nutrition',
    description: 'Eating habits and hydration',
    icon: '🥗',
    color: '#34d399', // emerald
    weight: 1.0,
    sortOrder: 4,
  },
  {
    id: 'movement',
    name: 'Movement',
    description: 'Physical activity and exercise',
    icon: '🏃',
    color: '#fb923c', // orange
    weight: 1.0,
    sortOrder: 5,
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Connections and relationships',
    icon: '💬',
    color: '#f472b6', // pink
    weight: 0.8,
    sortOrder: 6,
  },
];

// ============================================
// SIGNALS
// ============================================
export const signals: Signal[] = [
  // Sleep
  {
    id: 'sleep-quality',
    domainId: 'sleep',
    name: 'Sleep Quality',
    description: 'How restful your sleep felt',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 1.2,
  },
  {
    id: 'sleep-duration',
    domainId: 'sleep',
    name: 'Duration',
    description: 'Hours of sleep',
    unit: 'hours',
    minValue: 0,
    maxValue: 12,
    optimalMin: 7,
    optimalMax: 9,
    weight: 1.0,
  },
  {
    id: 'sleep-onset',
    domainId: 'sleep',
    name: 'Falling Asleep',
    description: 'Ease of falling asleep',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 0.8,
  },
  // Mental
  {
    id: 'mood',
    domainId: 'mental',
    name: 'Mood',
    description: 'Overall emotional state',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 1.2,
  },
  {
    id: 'stress',
    domainId: 'mental',
    name: 'Stress',
    description: 'Stress and tension levels',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 1,
    optimalMax: 2,
    weight: 1.1,
  },
  {
    id: 'clarity',
    domainId: 'mental',
    name: 'Clarity',
    description: 'Mental focus and sharpness',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 1.0,
  },
  // Energy
  {
    id: 'morning-energy',
    domainId: 'energy',
    name: 'Morning Energy',
    description: 'Energy upon waking',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 1.0,
  },
  {
    id: 'afternoon-energy',
    domainId: 'energy',
    name: 'Afternoon Energy',
    description: 'Sustained energy through day',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 3,
    optimalMax: 5,
    weight: 0.9,
  },
  // Nutrition
  {
    id: 'meal-quality',
    domainId: 'nutrition',
    name: 'Meal Quality',
    description: 'Nutritional quality of meals',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 1.0,
  },
  {
    id: 'hydration',
    domainId: 'nutrition',
    name: 'Hydration',
    description: 'Water intake',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 4,
    optimalMax: 5,
    weight: 0.9,
  },
  // Movement
  {
    id: 'activity-level',
    domainId: 'movement',
    name: 'Activity',
    description: 'Physical activity level',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 3,
    optimalMax: 4,
    weight: 1.0,
  },
  {
    id: 'movement-breaks',
    domainId: 'movement',
    name: 'Breaks',
    description: 'Movement breaks from sitting',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 3,
    optimalMax: 5,
    weight: 0.8,
  },
  // Social
  {
    id: 'social-satisfaction',
    domainId: 'social',
    name: 'Connection',
    description: 'Social connection satisfaction',
    unit: '1-5 scale',
    minValue: 1,
    maxValue: 5,
    optimalMin: 3,
    optimalMax: 5,
    weight: 1.0,
  },
  {
    id: 'meaningful-connection',
    domainId: 'social',
    name: 'Quality Time',
    description: 'Meaningful conversations',
    unit: 'boolean',
    minValue: 0,
    maxValue: 1,
    weight: 0.9,
  },
];

// ============================================
// QUESTIONS
// ============================================
export const questions: Question[] = [
  // Sleep
  {
    id: 'q-sleep-quality',
    signalId: 'sleep-quality',
    text: 'How would you rate your sleep quality last night?',
    shortText: 'Sleep quality same as usual?',
    questionType: 'scale',
    options: ['Very poor', 'Poor', 'Average', 'Good', 'Excellent'],
    isPrimary: true,
  },
  {
    id: 'q-sleep-duration',
    signalId: 'sleep-duration',
    text: 'How many hours did you sleep last night?',
    shortText: 'Slept around the same hours?',
    questionType: 'number',
    isPrimary: true,
  },
  {
    id: 'q-sleep-onset',
    signalId: 'sleep-onset',
    text: 'How easily did you fall asleep?',
    shortText: 'Fell asleep easily?',
    questionType: 'scale',
    options: ['Very hard', 'Difficult', 'Average', 'Easy', 'Very easy'],
    isPrimary: true,
  },
  // Mental
  {
    id: 'q-mood',
    signalId: 'mood',
    text: 'How would you describe your overall mood today?',
    shortText: 'Mood similar to usual?',
    questionType: 'scale',
    options: ['Very low', 'Low', 'Neutral', 'Good', 'Great'],
    isPrimary: true,
  },
  {
    id: 'q-stress',
    signalId: 'stress',
    text: 'How stressed did you feel today?',
    shortText: 'Stress level normal?',
    questionType: 'scale',
    options: ['Very relaxed', 'Relaxed', 'Moderate', 'Stressed', 'Very stressed'],
    isPrimary: true,
  },
  {
    id: 'q-clarity',
    signalId: 'clarity',
    text: 'How clear and focused was your thinking?',
    shortText: 'Mental clarity normal?',
    questionType: 'scale',
    options: ['Very foggy', 'Foggy', 'Average', 'Clear', 'Very clear'],
    isPrimary: true,
  },
  // Energy
  {
    id: 'q-morning-energy',
    signalId: 'morning-energy',
    text: 'How energized did you feel when you woke up?',
    shortText: 'Morning energy normal?',
    questionType: 'scale',
    options: ['Very tired', 'Tired', 'Average', 'Energized', 'Very energized'],
    isPrimary: true,
  },
  {
    id: 'q-afternoon-energy',
    signalId: 'afternoon-energy',
    text: 'How was your energy in the afternoon?',
    shortText: 'Afternoon energy stable?',
    questionType: 'scale',
    options: ['Very low', 'Low', 'Moderate', 'Good', 'High'],
    isPrimary: true,
  },
  // Nutrition
  {
    id: 'q-meal-quality',
    signalId: 'meal-quality',
    text: 'How balanced and nutritious were your meals?',
    shortText: 'Meals balanced as usual?',
    questionType: 'scale',
    options: ['Very poor', 'Poor', 'Average', 'Good', 'Excellent'],
    isPrimary: true,
  },
  {
    id: 'q-hydration',
    signalId: 'hydration',
    text: 'How well did you stay hydrated?',
    shortText: 'Hydration normal?',
    questionType: 'scale',
    options: ['Very dehydrated', 'Dehydrated', 'Adequate', 'Well hydrated', 'Excellently hydrated'],
    isPrimary: true,
  },
  // Movement
  {
    id: 'q-activity-level',
    signalId: 'activity-level',
    text: 'How would you rate your physical activity today?',
    shortText: 'Activity level normal?',
    questionType: 'scale',
    options: ['None', 'Light', 'Moderate', 'Active', 'Very active'],
    isPrimary: true,
  },
  {
    id: 'q-movement-breaks',
    signalId: 'movement-breaks',
    text: 'How often did you take movement breaks?',
    shortText: 'Normal movement breaks?',
    questionType: 'scale',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Very often'],
    isPrimary: true,
  },
  // Social
  {
    id: 'q-social-satisfaction',
    signalId: 'social-satisfaction',
    text: 'How satisfied were you with your social connections?',
    shortText: 'Social time satisfying?',
    questionType: 'scale',
    options: ['Very unsatisfied', 'Unsatisfied', 'Neutral', 'Satisfied', 'Very satisfied'],
    isPrimary: true,
  },
  {
    id: 'q-meaningful-connection',
    signalId: 'meaningful-connection',
    text: 'Did you have any meaningful conversations today?',
    shortText: 'Had meaningful connection?',
    questionType: 'boolean',
    isPrimary: true,
  },
];

// ============================================
// INSIGHT TEMPLATES
// ============================================
export const insightTemplates: InsightTemplate[] = [
  // Decline alerts
  {
    id: 'it-sleep-decline',
    domainId: 'sleep',
    triggerType: 'decline',
    threshold: -15,
    daysToEvaluate: 5,
    title: 'Sleep Pattern Change',
    message: 'Your sleep quality has decreased over the past {days} days.',
    actionSuggestion: 'Try setting a consistent bedtime tonight.',
    priority: 8,
  },
  {
    id: 'it-mental-decline',
    domainId: 'mental',
    triggerType: 'decline',
    threshold: -20,
    daysToEvaluate: 5,
    title: 'Elevated Stress Noticed',
    message: 'Your mental wellbeing scores have been lower than usual.',
    actionSuggestion: 'Take a 5-minute break for deep breathing.',
    priority: 9,
  },
  {
    id: 'it-movement-decline',
    domainId: 'movement',
    triggerType: 'decline',
    threshold: -25,
    daysToEvaluate: 7,
    title: 'Movement Decrease',
    message: 'Your physical activity has been lower than usual.',
    actionSuggestion: 'Even a 10-minute walk can help!',
    priority: 6,
  },
  // Progress
  {
    id: 'it-sleep-improve',
    domainId: 'sleep',
    triggerType: 'improvement',
    threshold: 10,
    daysToEvaluate: 7,
    title: 'Great Sleep Progress!',
    message: 'Your sleep quality has improved this week. Keep it up!',
    priority: 4,
  },
  {
    id: 'it-movement-improve',
    domainId: 'movement',
    triggerType: 'improvement',
    threshold: 15,
    daysToEvaluate: 7,
    title: 'Excellent Activity!',
    message: "You've been more active than usual. Your body thanks you!",
    priority: 4,
  },
  // Milestones
  {
    id: 'it-streak-7',
    triggerType: 'consistency',
    threshold: 7,
    daysToEvaluate: 7,
    title: '🔥 7-Day Streak!',
    message: "You've checked in for 7 days in a row!",
    priority: 7,
  },
  {
    id: 'it-streak-14',
    triggerType: 'consistency',
    threshold: 14,
    daysToEvaluate: 14,
    title: '🏆 Two Week Champion!',
    message: 'Incredible 14-day streak! Your baseline is now reliable.',
    priority: 8,
  },
  {
    id: 'it-month',
    triggerType: 'milestone',
    threshold: 30,
    daysToEvaluate: 30,
    title: '🌟 One Month!',
    message: "You've been tracking for a full month. Your insights are highly accurate now.",
    priority: 9,
  },
];

// Helper functions
export function getDomainById(id: string): Domain | undefined {
  return domains.find(d => d.id === id);
}

export function getSignalById(id: string): Signal | undefined {
  return signals.find(s => s.id === id);
}

export function getQuestionById(id: string): Question | undefined {
  return questions.find(q => q.id === id);
}

export function getSignalsByDomain(domainId: string): Signal[] {
  return signals.filter(s => s.domainId === domainId);
}

export function getQuestionBySignal(signalId: string): Question | undefined {
  return questions.find(q => q.signalId === signalId && q.isPrimary);
}


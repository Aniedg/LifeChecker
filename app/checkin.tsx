import { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, getDomainColor } from '../src/utils/theme';
import { selectDailyQuestions } from '../src/store/questionSelector';
import { saveResponse, markQuestionAsked } from '../src/store/storage';
import { QuestionWithContext, Response } from '../src/types';

export default function CheckInScreen() {
  const [questions, setQuestions] = useState<QuestionWithContext[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [numInput, setNumInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const selected = await selectDailyQuestions(5);
    setQuestions(selected);
    setLoading(false);
    
    if (selected.length === 0) {
      setIsComplete(true);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const handleResponse = async (value: number, rawValue: string, isConfirm: boolean = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const response: Response = {
      id: `resp-${Date.now()}`,
      questionId: currentQuestion.id,
      signalId: currentQuestion.signalId,
      value,
      rawValue,
      timestamp: new Date().toISOString(),
      isConfirm,
    };

    await saveResponse(response);
    await markQuestionAsked(currentQuestion.id);

    // Reset state
    setSelectedOption(null);
    setNumInput('');

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsComplete(true);
    }
  };

  const handleConfirm = () => {
    const avgValue = currentQuestion.recentResponses.length > 0
      ? currentQuestion.recentResponses.reduce((a, b) => a + b, 0) / currentQuestion.recentResponses.length
      : 3;
    handleResponse(avgValue, 'same', true);
  };

  const handleScaleSelect = (index: number) => {
    setSelectedOption(index);
    Haptics.selectionAsync();
    
    setTimeout(() => {
      const options = currentQuestion.options || [];
      handleResponse(index + 1, options[index] || String(index + 1));
    }, 200);
  };

  const handleNumberSubmit = () => {
    const value = parseFloat(numInput);
    if (!isNaN(value)) {
      handleResponse(value, numInput);
    }
  };

  const handleBooleanResponse = (answer: boolean) => {
    handleResponse(answer ? 1 : 0, answer ? 'Yes' : 'No');
  };

  const handleClose = () => {
    router.back();
  };

  const handleGoBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setSelectedOption(null);
      setNumInput('');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingIcon}>✦</Text>
          <Text style={styles.loadingText}>Preparing your check-in...</Text>
        </View>
      </View>
    );
  }

  // Completion state
  if (isComplete) {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeIcon}>🎉</Text>
          <Text style={styles.completeTitle}>
            {questions.length === 0 ? 'All caught up!' : 'Check-in complete!'}
          </Text>
          <Text style={styles.completeText}>
            {questions.length === 0 
              ? "You've answered all today's questions. Check back tomorrow!"
              : 'Thanks for checking in. Your insights are updating...'}
          </Text>
          <TouchableOpacity style={styles.completeButton} onPress={handleClose}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.completeButtonGradient}
            >
              <Text style={styles.completeButtonText}>Back to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {currentIndex + 1} of {questions.length}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      {/* Question */}
      <ScrollView style={styles.questionContainer} contentContainerStyle={styles.questionContent}>
        {/* Domain indicator */}
        <View style={styles.domainIndicator}>
          <View style={[styles.domainIcon, { backgroundColor: getDomainColor(currentQuestion.domain.id) + '20' }]}>
            <Text style={styles.domainEmoji}>{currentQuestion.domain.icon}</Text>
          </View>
          <Text style={styles.domainText}>
            {currentQuestion.domain.name} · {currentQuestion.signal.name}
          </Text>
        </View>

        {/* Question text */}
        <Text style={styles.questionText}>
          {currentQuestion.useConfirmation 
            ? currentQuestion.shortText || currentQuestion.text
            : currentQuestion.text}
        </Text>

        {/* Answer options */}
        <View style={styles.answersContainer}>
          {currentQuestion.useConfirmation ? (
            // Confirmation mode
            <View style={styles.confirmContainer}>
              <Text style={styles.recentAvg}>
                Recent average: {Math.round(
                  currentQuestion.recentResponses.reduce((a, b) => a + b, 0) / 
                  currentQuestion.recentResponses.length * 10
                ) / 10}
              </Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <LinearGradient
                    colors={[colors.success + '30', colors.success + '10']}
                    style={styles.confirmButtonGradient}
                  >
                    <Text style={styles.confirmButtonText}>Same as usual ✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => {
                    const updatedQuestions = [...questions];
                    updatedQuestions[currentIndex].useConfirmation = false;
                    setQuestions(updatedQuestions);
                  }}
                >
                  <View style={styles.changedButton}>
                    <Text style={styles.changedButtonText}>Changed today</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          ) : currentQuestion.questionType === 'scale' && currentQuestion.options ? (
            // Scale options
            <View style={styles.scaleOptions}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.scaleOption,
                    selectedOption === index && styles.scaleOptionSelected,
                  ]}
                  onPress={() => handleScaleSelect(index)}
                >
                  <View style={styles.scaleOptionContent}>
                    <View style={[
                      styles.scaleNumber,
                      selectedOption === index && styles.scaleNumberSelected,
                    ]}>
                      <Text style={[
                        styles.scaleNumberText,
                        selectedOption === index && styles.scaleNumberTextSelected,
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <Text style={[
                      styles.scaleText,
                      selectedOption === index && styles.scaleTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : currentQuestion.questionType === 'number' ? (
            // Number input
            <View style={styles.numberContainer}>
              <TextInput
                style={styles.numberInput}
                value={numInput}
                onChangeText={setNumInput}
                keyboardType="decimal-pad"
                placeholder="Enter a number"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.submitButton, !numInput && styles.submitButtonDisabled]}
                onPress={handleNumberSubmit}
                disabled={!numInput}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : currentQuestion.questionType === 'boolean' ? (
            // Boolean options
            <View style={styles.booleanContainer}>
              <TouchableOpacity
                style={styles.booleanButton}
                onPress={() => handleBooleanResponse(true)}
              >
                <LinearGradient
                  colors={[colors.success + '30', colors.success + '10']}
                  style={styles.booleanGradient}
                >
                  <Text style={styles.booleanText}>Yes</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.booleanButton}
                onPress={() => handleBooleanResponse(false)}
              >
                <View style={styles.booleanNo}>
                  <Text style={styles.booleanNoText}>No</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Back button */}
        {currentIndex > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Previous</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  loadingText: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completeIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  completeTitle: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  completeText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  completeButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  completeButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  completeButtonText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  progressInfo: {},
  progressText: {
    ...typography.subhead,
    color: colors.textMuted,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  questionContainer: {
    flex: 1,
  },
  questionContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  domainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  domainIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  domainEmoji: {
    fontSize: 18,
  },
  domainText: {
    ...typography.subhead,
    color: colors.textMuted,
  },
  questionText: {
    ...typography.title1,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  answersContainer: {
    flex: 1,
  },
  confirmContainer: {
    alignItems: 'center',
  },
  recentAvg: {
    ...typography.footnote,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  confirmButtons: {
    width: '100%',
    gap: spacing.md,
  },
  confirmButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  confirmButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  confirmButtonText: {
    ...typography.headline,
    color: colors.success,
  },
  changedButton: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  changedButtonText: {
    ...typography.headline,
    color: colors.textSecondary,
  },
  scaleOptions: {
    gap: spacing.sm,
  },
  scaleOption: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  scaleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scaleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  scaleNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  scaleNumberSelected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  scaleNumberText: {
    ...typography.subhead,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  scaleNumberTextSelected: {
    color: colors.textPrimary,
  },
  scaleText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  scaleTextSelected: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  numberContainer: {
    gap: spacing.lg,
  },
  numberInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.surface,
  },
  submitButtonText: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  booleanButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  booleanGradient: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  booleanText: {
    ...typography.title3,
    color: colors.success,
  },
  booleanNo: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  booleanNoText: {
    ...typography.title3,
    color: colors.textSecondary,
  },
  backButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  backButtonText: {
    ...typography.subhead,
    color: colors.textMuted,
  },
});

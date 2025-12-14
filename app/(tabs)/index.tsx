import { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Dimensions,
  Animated as RNAnimated,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { colors, spacing, borderRadius, typography, getDomainColor, getTrendColor } from '../../src/utils/theme';
import { domains, getDomainById } from '../../src/store/data';
import { 
  getTodayDomainSummaries, 
  getOverallScore, 
  hasCheckedInToday,
  getActiveInsights,
  getCheckInStreak,
} from '../../src/store/storage';
import { DomainSummary, Insight } from '../../src/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [domainSummaries, setDomainSummaries] = useState<DomainSummary[]>([]);
  const [overallScore, setOverallScore] = useState({ score: 0, trend: 'stable' });
  const [checkedIn, setCheckedIn] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [summaries, score, hasChecked, activeInsights, currentStreak] = await Promise.all([
        getTodayDomainSummaries(),
        getOverallScore(),
        hasCheckedInToday(),
        getActiveInsights(),
        getCheckInStreak(),
      ]);
      
      setDomainSummaries(summaries);
      setOverallScore(score);
      setCheckedIn(hasChecked);
      setInsights(activeInsights.slice(0, 3));
      setStreak(currentStreak);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currentDate = format(new Date(), 'EEEE, MMMM d');
  const greeting = getGreeting();

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{currentDate}</Text>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>Here's your health overview</Text>
      </View>

      {/* Score Card */}
      <LinearGradient
        colors={[colors.primary + '30', colors.primary + '10']}
        style={styles.scoreCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.scoreContent}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{overallScore.score}</Text>
            <Text style={styles.scoreLabel}>/ 100</Text>
          </View>
          <View style={styles.scoreInfo}>
            <Text style={styles.scoreTitle}>Overall Wellbeing</Text>
            <View style={styles.trendContainer}>
              <Text style={[styles.trendIcon, { color: getTrendColor(overallScore.trend) }]}>
                {overallScore.trend === 'improving' ? '↑' : overallScore.trend === 'declining' ? '↓' : '→'}
              </Text>
              <Text style={styles.trendText}>
                {overallScore.trend === 'improving' ? 'Improving' : 
                 overallScore.trend === 'declining' ? 'Needs attention' : 'Stable'}
              </Text>
            </View>
            {streak > 0 && (
              <Text style={styles.streakText}>🔥 {streak} day streak</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Check-in CTA */}
      <TouchableOpacity
        style={[styles.checkinCard, checkedIn && styles.checkinCardDone]}
        onPress={() => router.push('/checkin')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={checkedIn 
            ? [colors.success + '20', colors.success + '10'] 
            : [colors.primary, colors.primaryDark]}
          style={styles.checkinGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {checkedIn ? (
            <View style={styles.checkinContent}>
              <Text style={styles.checkinIcon}>✓</Text>
              <View>
                <Text style={styles.checkinTitle}>All caught up!</Text>
                <Text style={styles.checkinSubtitle}>Tap to add more responses</Text>
              </View>
            </View>
          ) : (
            <View style={styles.checkinContent}>
              <Text style={styles.checkinIcon}>✦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.checkinTitleActive}>Daily Check-in</Text>
                <Text style={styles.checkinSubtitleActive}>Takes less than 2 minutes</Text>
              </View>
              <Text style={styles.checkinArrow}>→</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Domains Grid */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Domains</Text>
          <TouchableOpacity onPress={() => router.push('/summary')}>
            <Text style={styles.sectionLink}>Details →</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.domainsGrid}>
          {domains.map((domain) => {
            const summary = domainSummaries.find(s => s.domainId === domain.id);
            const score = summary?.score ?? 0;
            const trend = summary?.trend ?? 'stable';
            
            return (
              <View key={domain.id} style={styles.domainCard}>
                <LinearGradient
                  colors={[getDomainColor(domain.id) + '20', getDomainColor(domain.id) + '08']}
                  style={styles.domainCardGradient}
                >
                  <Text style={styles.domainIcon}>{domain.icon}</Text>
                  <Text style={styles.domainName}>{domain.name}</Text>
                  <View style={styles.domainScoreRow}>
                    <Text style={styles.domainScore}>{score}</Text>
                    <Text style={[styles.domainTrend, { color: getTrendColor(trend) }]}>
                      {trend === 'improving' ? '↑' : trend === 'declining' ? '↓' : '→'}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${score}%`,
                          backgroundColor: getDomainColor(domain.id),
                        }
                      ]} 
                    />
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </View>

      {/* Recent Insights */}
      {insights.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Insights</Text>
            <TouchableOpacity onPress={() => router.push('/insights')}>
              <Text style={styles.sectionLink}>View all →</Text>
            </TouchableOpacity>
          </View>
          
          {insights.map((insight) => (
            <TouchableOpacity 
              key={insight.id}
              style={[styles.insightCard, !insight.isRead && styles.insightCardUnread]}
              onPress={() => router.push('/insights')}
            >
              <Text style={styles.insightIcon}>
                {insight.insightType === 'alert' ? '⚡' :
                 insight.insightType === 'progress' ? '✨' :
                 insight.insightType === 'milestone' ? '🎯' : '💡'}
              </Text>
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightMessage} numberOfLines={2}>{insight.message}</Text>
              </View>
              {!insight.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 60,
  },
  header: {
    marginBottom: spacing.xl,
  },
  date: {
    ...typography.footnote,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  greeting: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  scoreCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  scoreNumber: {
    ...typography.title1,
    color: colors.textPrimary,
  },
  scoreLabel: {
    ...typography.caption2,
    color: colors.textMuted,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  trendText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  streakText: {
    ...typography.footnote,
    color: colors.energy,
    marginTop: spacing.xs,
  },
  checkinCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  checkinCardDone: {},
  checkinGradient: {
    padding: spacing.lg,
  },
  checkinContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkinIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  checkinTitle: {
    ...typography.headline,
    color: colors.success,
  },
  checkinSubtitle: {
    ...typography.footnote,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkinTitleActive: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  checkinSubtitleActive: {
    ...typography.footnote,
    color: colors.textPrimary,
    opacity: 0.8,
    marginTop: 2,
  },
  checkinArrow: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  sectionLink: {
    ...typography.subhead,
    color: colors.primary,
  },
  domainsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  domainCard: {
    width: (width - spacing.lg * 2 - spacing.xs * 4) / 2,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  domainCardGradient: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  domainIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  domainName: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  domainScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  domainScore: {
    ...typography.title2,
    color: colors.textPrimary,
    marginRight: spacing.xs,
  },
  domainTrend: {
    fontSize: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  insightCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  insightMessage: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});

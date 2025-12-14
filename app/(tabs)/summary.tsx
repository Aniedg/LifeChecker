import { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays, startOfDay } from 'date-fns';
import { colors, spacing, borderRadius, typography, getDomainColor, getTrendColor } from '../../src/utils/theme';
import { domains, getSignalsByDomain } from '../../src/store/data';
import { 
  getDomainHistory,
  getRecentResponses,
  getCheckInStreak,
  getDomainSummaries,
} from '../../src/store/storage';
import { DomainSummary } from '../../src/types';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 4;
const CHART_HEIGHT = 80;

export default function SummaryScreen() {
  const [domainData, setDomainData] = useState<{
    domain: typeof domains[0];
    history: DomainSummary[];
    currentScore: number;
    trend: string;
    signals: string[];
  }[]>([]);
  const [stats, setStats] = useState({
    checkInDays: 0,
    currentStreak: 0,
    overallChange: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState({ start: '', end: '' });

  const loadData = useCallback(async () => {
    try {
      const today = startOfDay(new Date());
      const twoWeeksAgo = subDays(today, 14);

      setPeriod({
        start: format(twoWeeksAgo, 'MMM d'),
        end: format(today, 'MMM d'),
      });

      // Get domain histories
      const data = await Promise.all(
        domains.map(async (domain) => {
          const history = await getDomainHistory(domain.id, 14);
          const signals = getSignalsByDomain(domain.id).map(s => s.name);
          const currentScore = history.length > 0 ? history[history.length - 1].score : 0;
          const trend = history.length > 0 ? history[history.length - 1].trend : 'stable';
          
          return { domain, history, currentScore, trend, signals };
        })
      );
      setDomainData(data);

      // Get stats
      const responses = await getRecentResponses(14);
      const uniqueDays = new Set(
        responses.map(r => format(new Date(r.timestamp), 'yyyy-MM-dd'))
      );
      const streak = await getCheckInStreak();

      // Calculate change
      const allSummaries = await getDomainSummaries();
      const recentSummaries = allSummaries.filter(
        s => new Date(s.date) >= subDays(today, 7)
      );
      const oldSummaries = allSummaries.filter(
        s => new Date(s.date) >= subDays(today, 14) && new Date(s.date) < subDays(today, 7)
      );

      const recentAvg = recentSummaries.length > 0
        ? recentSummaries.reduce((a, s) => a + s.score, 0) / recentSummaries.length
        : 50;
      const oldAvg = oldSummaries.length > 0
        ? oldSummaries.reduce((a, s) => a + s.score, 0) / oldSummaries.length
        : recentAvg;

      setStats({
        checkInDays: uniqueDays.size,
        currentStreak: streak,
        overallChange: Math.round(recentAvg - oldAvg),
      });
    } catch (error) {
      console.error('Error loading summary:', error);
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

  const renderMiniChart = (history: DomainSummary[], color: string) => {
    if (history.length < 2) {
      return (
        <View style={styles.noDataChart}>
          <Text style={styles.noDataText}>Not enough data</Text>
        </View>
      );
    }

    const scores = history.map(h => h.score);
    const maxScore = Math.max(...scores, 100);
    const minScore = Math.min(...scores, 0);
    const range = maxScore - minScore || 1;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartLine}>
          {scores.map((score, index) => {
            const x = (index / (scores.length - 1)) * CHART_WIDTH;
            const y = CHART_HEIGHT - ((score - minScore) / range) * CHART_HEIGHT;
            
            return (
              <View
                key={index}
                style={[
                  styles.chartDot,
                  {
                    left: x - 4,
                    top: y - 4,
                    backgroundColor: color,
                  },
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

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
        <Text style={styles.title}>Weekly Summary</Text>
        <Text style={styles.period}>{period.start} — {period.end}</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.mental + '20' }]}>
          <Text style={styles.statIcon}>📅</Text>
          <Text style={styles.statValue}>{stats.checkInDays}</Text>
          <Text style={styles.statLabel}>Check-in Days</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.energy + '20' }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>{stats.currentStreak}</Text>
          <Text style={styles.statLabel}>Current Streak</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: stats.overallChange >= 0 ? colors.success + '20' : colors.error + '20' }]}>
          <Text style={styles.statIcon}>{stats.overallChange >= 0 ? '📈' : '📉'}</Text>
          <Text style={styles.statValue}>
            {stats.overallChange >= 0 ? '+' : ''}{stats.overallChange}%
          </Text>
          <Text style={styles.statLabel}>Overall Change</Text>
        </View>
      </View>

      {/* Domain Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Domain Trends</Text>
        
        {domainData.map((item) => (
          <View key={item.domain.id} style={styles.domainDetailCard}>
            <LinearGradient
              colors={[getDomainColor(item.domain.id) + '15', 'transparent']}
              style={styles.domainGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.domainHeader}>
                <View style={styles.domainInfo}>
                  <View style={styles.domainTitleRow}>
                    <Text style={styles.domainIcon}>{item.domain.icon}</Text>
                    <Text style={styles.domainName}>{item.domain.name}</Text>
                    <View style={[styles.trendBadge, { backgroundColor: getTrendColor(item.trend) + '20' }]}>
                      <Text style={[styles.trendBadgeText, { color: getTrendColor(item.trend) }]}>
                        {item.trend === 'improving' ? '↑ Improving' :
                         item.trend === 'declining' ? '↓ Needs attention' : '→ Stable'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.scoreRow}>
                    <Text style={styles.currentScore}>{item.currentScore}</Text>
                    <Text style={styles.scoreMax}>/ 100</Text>
                  </View>
                </View>
              </View>

              {/* Mini Chart */}
              {renderMiniChart(item.history, getDomainColor(item.domain.id))}

              {/* Signals */}
              <View style={styles.signalsContainer}>
                <Text style={styles.signalsLabel}>Tracking</Text>
                <View style={styles.signalTags}>
                  {item.signals.map((signal) => (
                    <View key={signal} style={styles.signalTag}>
                      <Text style={styles.signalTagText}>{signal}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </View>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
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
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  period: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.title2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption1,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  domainDetailCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  domainGradient: {
    padding: spacing.lg,
  },
  domainHeader: {
    marginBottom: spacing.md,
  },
  domainInfo: {},
  domainTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  domainIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  domainName: {
    ...typography.headline,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  trendBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendBadgeText: {
    ...typography.caption1,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentScore: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  scoreMax: {
    ...typography.subhead,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    marginBottom: spacing.md,
  },
  chartLine: {
    flex: 1,
    position: 'relative',
  },
  chartDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  noDataChart: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  noDataText: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  signalsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.md,
  },
  signalsLabel: {
    ...typography.caption2,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  signalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  signalTag: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  signalTagText: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
});

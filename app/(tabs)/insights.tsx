import { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { colors, spacing, borderRadius, typography } from '../../src/utils/theme';
import { getActiveInsights, markInsightRead, dismissInsight } from '../../src/store/storage';
import { Insight } from '../../src/types';

export default function InsightsScreen() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = useCallback(async () => {
    const data = await getActiveInsights();
    setInsights(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  };

  const handleMarkRead = async (id: string) => {
    await markInsightRead(id);
    setInsights(prev => prev.map(i => 
      i.id === id ? { ...i, isRead: true } : i
    ));
  };

  const handleDismiss = async (id: string) => {
    await dismissInsight(id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  const filteredInsights = filter === 'all' 
    ? insights 
    : insights.filter(i => !i.isRead);

  const unreadCount = insights.filter(i => !i.isRead).length;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert': return '⚡';
      case 'progress': return '✨';
      case 'milestone': return '🎯';
      case 'tip': return '💡';
      default: return '◐';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'alert': return colors.warning;
      case 'progress': return colors.success;
      case 'milestone': return colors.mental;
      case 'tip': return colors.info;
      default: return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>
          {unreadCount > 0 
            ? `${unreadCount} new insight${unreadCount > 1 ? 's' : ''}`
            : 'All caught up'}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {filteredInsights.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {filter === 'unread' ? '✓' : '🌿'}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === 'unread' ? 'All caught up!' : 'No insights yet'}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'unread' 
                ? 'All insights have been read'
                : 'Keep tracking daily to see patterns and trends'}
            </Text>
          </View>
        ) : (
          filteredInsights.map((insight) => (
            <View
              key={insight.id}
              style={[
                styles.insightCard,
                !insight.isRead && styles.insightCardUnread,
                { borderLeftColor: getInsightColor(insight.insightType) },
              ]}
            >
              <View style={styles.insightHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getInsightColor(insight.insightType) + '20' }]}>
                  <Text style={styles.insightIcon}>{getInsightIcon(insight.insightType)}</Text>
                </View>
                <View style={styles.insightMeta}>
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                  <Text style={styles.insightDomain}>
                    {insight.domainName} · {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true })}
                  </Text>
                </View>
                {!insight.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.insightMessage}>{insight.message}</Text>

              {insight.action && (
                <View style={styles.actionContainer}>
                  <Text style={styles.actionIcon}>💡</Text>
                  <Text style={styles.actionText}>{insight.action}</Text>
                </View>
              )}

              <View style={styles.insightActions}>
                {!insight.isRead && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleMarkRead(insight.id)}
                  >
                    <Text style={styles.actionButtonText}>Mark as read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDismiss(insight.id)}
                >
                  <Text style={styles.dismissButtonText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  filterTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
  },
  insightCardUnread: {
    backgroundColor: colors.surfaceLight,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  insightIcon: {
    fontSize: 22,
  },
  insightMeta: {
    flex: 1,
  },
  insightTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  insightDomain: {
    ...typography.footnote,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  insightMessage: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  actionText: {
    ...typography.subhead,
    color: colors.primary,
    flex: 1,
  },
  insightActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionButtonText: {
    ...typography.subhead,
    color: colors.primary,
    fontWeight: '600',
  },
  dismissButtonText: {
    ...typography.subhead,
    color: colors.textMuted,
  },
});

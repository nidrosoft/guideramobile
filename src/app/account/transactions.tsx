/**
 * TRANSACTION HISTORY SCREEN
 * 
 * User's payment history - all transactions, refunds, etc.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  ArrowUp,
  ArrowDown,
  Receipt1,
  Airplane,
  Building,
  Car,
  Activity,
  TicketStar,
  Card,
  Wallet,
  Bank,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { bookingService, Transaction, TransactionStatus } from '@/services/booking.service';

const STATUS_STYLES: Record<TransactionStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFF3E0', text: '#E65100' },
  completed: { bg: '#E8F5E9', text: '#2E7D32' },
  failed: { bg: '#FFEBEE', text: '#C62828' },
  refunded: { bg: '#F3E5F5', text: '#7B1FA2' },
  cancelled: { bg: '#ECEFF1', text: '#546E7A' },
};

const BOOKING_TYPE_ICONS: Record<string, any> = {
  flight: Airplane,
  hotel: Building,
  car: Car,
  experience: Activity,
  package: TicketStar,
};

const PAYMENT_METHOD_ICONS: Record<string, any> = {
  card: Card,
  paypal: Wallet,
  apple_pay: Wallet,
  google_pay: Wallet,
  bank: Bank,
};

export default function TransactionsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState({ totalSpent: 0, totalRefunded: 0, transactionCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const [transRes, summaryRes] = await Promise.all([
        bookingService.getTransactions(user.id),
        bookingService.getTransactionSummary(user.id),
      ]);
      
      if (transRes.data) setTransactions(transRes.data);
      setSummary(summaryRes);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Summary Cards */}
            <View style={styles.summaryContainer}>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: `${colors.success}15` }]}>
                  <ArrowUp size={20} color={colors.success} />
                </View>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(summary.totalSpent)}
                </Text>
              </View>
              
              <View style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: `${colors.error}15` }]}>
                  <ArrowDown size={20} color={colors.error} />
                </View>
                <Text style={styles.summaryLabel}>Refunded</Text>
                <Text style={styles.summaryAmount}>
                  {formatCurrency(summary.totalRefunded)}
                </Text>
              </View>
            </View>

            {/* Transactions List */}
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Receipt1 size={48} color={colors.gray300} variant="Bold" />
                <Text style={styles.emptyTitle}>No transactions yet</Text>
                <Text style={styles.emptyText}>
                  Your payment history will appear here
                </Text>
              </View>
            ) : (
              sortedDates.map(date => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>
                    {formatDateHeader(date)}
                  </Text>
                  {groupedTransactions[date].map(transaction => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      formatCurrency={formatCurrency}
                      formatTime={formatTime}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
    });
  }
}

// Transaction Card Component
interface TransactionCardProps {
  transaction: Transaction;
  formatCurrency: (amount: number, currency?: string) => string;
  formatTime: (dateStr: string) => string;
}

function TransactionCard({ transaction, formatCurrency, formatTime }: TransactionCardProps) {
  const isRefund = transaction.type === 'refund';
  const statusStyle = STATUS_STYLES[transaction.status] || STATUS_STYLES.pending;
  
  // Get icon based on booking type or payment method
  const getIcon = () => {
    if (transaction.booking?.type) {
      const BookingIcon = BOOKING_TYPE_ICONS[transaction.booking.type] || Receipt1;
      return <BookingIcon size={20} color={colors.textPrimary} variant="Bold" />;
    }
    if (transaction.payment_method?.type) {
      const PaymentIcon = PAYMENT_METHOD_ICONS[transaction.payment_method.type] || Card;
      return <PaymentIcon size={20} color={colors.textPrimary} variant="Bold" />;
    }
    return <Receipt1 size={20} color={colors.textPrimary} variant="Bold" />;
  };

  const getTitle = () => {
    if (transaction.booking) {
      const type = transaction.booking.type.charAt(0).toUpperCase() + transaction.booking.type.slice(1);
      return isRefund ? `${type} Refund` : `${type} Booking`;
    }
    return transaction.description || (isRefund ? 'Refund' : 'Payment');
  };

  const getSubtitle = () => {
    if (transaction.booking?.reference_number) {
      return `#${transaction.booking.reference_number}`;
    }
    if (transaction.payment_method) {
      const pm = transaction.payment_method;
      if (pm.brand && pm.last_four) {
        return `${pm.brand} ••${pm.last_four}`;
      }
    }
    return formatTime(transaction.created_at);
  };
  
  return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionIcon}>
        {getIcon()}
      </View>
      
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {getTitle()}
        </Text>
        <Text style={styles.transactionSubtitle}>
          {getSubtitle()}
        </Text>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          isRefund && styles.refundAmount,
        ]}>
          {isRefund ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: spacing.lg,
  },
  dateHeader: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  transactionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  transactionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  refundAmount: {
    color: colors.success,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
  },
});

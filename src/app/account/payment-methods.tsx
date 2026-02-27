/**
 * PAYMENT METHODS SCREEN
 * 
 * User's saved payment methods - cards, wallets, bank accounts.
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
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Add,
  Card,
  Bank,
  Wallet,
  Apple,
  Trash,
  TickCircle,
  CloseCircle,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography, borderRadius } from '@/styles';
import { useAuth } from '@/context/AuthContext';
import { bookingService, PaymentMethod, PaymentMethodType } from '@/services/booking.service';

const TYPE_CONFIG: Record<PaymentMethodType, { icon: any; label: string; color: string }> = {
  card: { icon: Card, label: 'Credit/Debit Card', color: colors.primary },
  paypal: { icon: Wallet, label: 'PayPal', color: '#003087' },
  apple_pay: { icon: Apple, label: 'Apple Pay', color: colors.black },
  google_pay: { icon: Wallet, label: 'Google Pay', color: '#4285F4' },
  bank: { icon: Bank, label: 'Bank Account', color: colors.success },
};

const CARD_BRANDS: Record<string, { color: string; gradient: string[] }> = {
  visa: { color: '#1A1F71', gradient: ['#1A1F71', '#2E3B8C'] },
  mastercard: { color: '#EB001B', gradient: ['#EB001B', '#F79E1B'] },
  amex: { color: '#006FCF', gradient: ['#006FCF', '#00A3E0'] },
  discover: { color: '#FF6000', gradient: ['#FF6000', '#FF8C00'] },
  default: { color: colors.gray600, gradient: [colors.gray600, colors.gray800] },
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchPaymentMethods = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await bookingService.getPaymentMethods(user.id);
      
      if (error) {
        console.error('Error fetching payment methods:', error);
        return;
      }
      
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error in fetchPaymentMethods:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (method.is_default || !user?.id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { error } = await bookingService.setDefaultPaymentMethod(user.id, method.id);
    if (!error) {
      setPaymentMethods(prev => prev.map(m => ({
        ...m,
        is_default: m.id === method.id,
      })));
    }
  };

  const handleDelete = (method: PaymentMethod) => {
    if (method.is_default) {
      Alert.alert(
        'Cannot Delete',
        'You cannot delete your default payment method. Please set another method as default first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to remove this ${TYPE_CONFIG[method.type]?.label || 'payment method'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const { error } = await bookingService.deletePaymentMethod(method.id);
            if (!error) {
              setPaymentMethods(prev => prev.filter(m => m.id !== method.id));
            }
          },
        },
      ]
    );
  };

  const handleAddMethod = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowAddModal(true);
  };

  const getCardBrandStyle = (brand?: string) => {
    const normalizedBrand = brand?.toLowerCase() || 'default';
    return CARD_BRANDS[normalizedBrand] || CARD_BRANDS.default;
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <TouchableOpacity onPress={handleAddMethod} style={styles.addButton}>
          <Add size={24} color={colors.primary} />
        </TouchableOpacity>
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
        ) : paymentMethods.length === 0 ? (
          <View style={styles.emptyState}>
            <Card size={48} color={colors.gray300} variant="Bold" />
            <Text style={styles.emptyTitle}>No payment methods</Text>
            <Text style={styles.emptyText}>
              Add a card or payment method to make bookings faster
            </Text>
            <TouchableOpacity style={styles.addMethodButton} onPress={handleAddMethod}>
              <Add size={20} color={colors.white} />
              <Text style={styles.addMethodButtonText}>Add Payment Method</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Cards Section */}
            {paymentMethods.filter(m => m.type === 'card').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Cards</Text>
                {paymentMethods
                  .filter(m => m.type === 'card')
                  .map(method => (
                    <PaymentMethodCard
                      key={method.id}
                      method={method}
                      brandStyle={getCardBrandStyle(method.brand)}
                      onSetDefault={() => handleSetDefault(method)}
                      onDelete={() => handleDelete(method)}
                    />
                  ))}
              </View>
            )}

            {/* Digital Wallets Section */}
            {paymentMethods.filter(m => ['paypal', 'apple_pay', 'google_pay'].includes(m.type)).length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Digital Wallets</Text>
                {paymentMethods
                  .filter(m => ['paypal', 'apple_pay', 'google_pay'].includes(m.type))
                  .map(method => (
                    <WalletMethodCard
                      key={method.id}
                      method={method}
                      config={TYPE_CONFIG[method.type]}
                      onSetDefault={() => handleSetDefault(method)}
                      onDelete={() => handleDelete(method)}
                    />
                  ))}
              </View>
            )}

            {/* Bank Accounts Section */}
            {paymentMethods.filter(m => m.type === 'bank').length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank Accounts</Text>
                {paymentMethods
                  .filter(m => m.type === 'bank')
                  .map(method => (
                    <WalletMethodCard
                      key={method.id}
                      method={method}
                      config={TYPE_CONFIG[method.type]}
                      onSetDefault={() => handleSetDefault(method)}
                      onDelete={() => handleDelete(method)}
                    />
                  ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add Payment Method Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <CloseCircle size={24} color={colors.gray400} variant="Bold" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Choose a payment method to add
              </Text>
              
              {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                <TouchableOpacity
                  key={type}
                  style={styles.methodOption}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddModal(false);
                    // In production, this would open Stripe's payment sheet
                    Alert.alert(
                      'Coming Soon',
                      `${config.label} integration will be available soon. This requires Stripe setup.`,
                      [{ text: 'OK' }]
                    );
                  }}
                >
                  <View style={[styles.methodOptionIcon, { backgroundColor: `${config.color}15` }]}>
                    <config.icon size={24} color={config.color} variant="Bold" />
                  </View>
                  <Text style={styles.methodOptionText}>{config.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Payment Method Card Component (for credit/debit cards)
interface PaymentMethodCardProps {
  method: PaymentMethod;
  brandStyle: { color: string; gradient: string[] };
  onSetDefault: () => void;
  onDelete: () => void;
}

function PaymentMethodCard({ method, brandStyle, onSetDefault, onDelete }: PaymentMethodCardProps) {
  return (
    <View style={[styles.cardContainer, { backgroundColor: brandStyle.color }]}>
      <View style={styles.cardTop}>
        <Text style={styles.cardBrand}>
          {method.brand?.toUpperCase() || 'CARD'}
        </Text>
        {method.is_default && (
          <View style={styles.defaultBadge}>
            <TickCircle size={12} color={colors.white} variant="Bold" />
            <Text style={styles.defaultText}>Default</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.cardNumber}>•••• •••• •••• {method.last_four}</Text>
      
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.cardLabel}>Expires</Text>
          <Text style={styles.cardExpiry}>
            {String(method.expiry_month).padStart(2, '0')}/{method.expiry_year}
          </Text>
        </View>
        
        <View style={styles.cardActions}>
          {!method.is_default && (
            <TouchableOpacity style={styles.cardAction} onPress={onSetDefault}>
              <Text style={styles.cardActionText}>Set Default</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cardAction} onPress={onDelete}>
            <Trash size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// Wallet/Bank Method Card Component
interface WalletMethodCardProps {
  method: PaymentMethod;
  config: { icon: any; label: string; color: string };
  onSetDefault: () => void;
  onDelete: () => void;
}

function WalletMethodCard({ method, config, onSetDefault, onDelete }: WalletMethodCardProps) {
  const IconComponent = config.icon;
  
  return (
    <View style={styles.walletCard}>
      <View style={[styles.walletIcon, { backgroundColor: `${config.color}15` }]}>
        <IconComponent size={24} color={config.color} variant="Bold" />
      </View>
      
      <View style={styles.walletInfo}>
        <Text style={styles.walletTitle}>{config.label}</Text>
        {method.last_four && (
          <Text style={styles.walletSubtitle}>
            {method.type === 'bank' ? 'Account' : 'Ending in'} ••{method.last_four}
          </Text>
        )}
      </View>
      
      <View style={styles.walletActions}>
        {method.is_default ? (
          <View style={styles.walletDefaultBadge}>
            <TickCircle size={14} color={colors.success} variant="Bold" />
          </View>
        ) : (
          <TouchableOpacity onPress={onSetDefault} style={styles.walletAction}>
            <Text style={styles.setDefaultText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDelete} style={styles.walletAction}>
          <Trash size={18} color={colors.error} />
        </TouchableOpacity>
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: spacing.lg,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  addMethodButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Credit Card Styles
  cardContainer: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    minHeight: 180,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  cardBrand: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  defaultText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 2,
    marginBottom: spacing.xl,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardAction: {
    padding: spacing.xs,
  },
  cardActionText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  // Wallet Card Styles
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  walletIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  walletTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  walletSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  walletActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletAction: {
    padding: spacing.xs,
  },
  walletDefaultBadge: {
    padding: spacing.xs,
  },
  setDefaultText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  methodOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodOptionText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
});

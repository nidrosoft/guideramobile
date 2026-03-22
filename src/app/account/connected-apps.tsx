/**
 * CONNECTED APPS SCREEN
 * 
 * Shows SSO connections (Google, Apple, Facebook) from Clerk
 * and any linked travel accounts from the trip import system.
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ArrowLeft2, 
  Link21,
  TickCircle,
  CloseCircle,
  Global,
  Airplane,
  Building,
  Car,
} from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '@/lib/supabase/client';

interface LinkedAccount {
  id: string;
  provider: string;
  provider_name: string;
  account_email?: string;
  connected_at: string;
  last_synced_at?: string;
  status: string;
}

const PROVIDER_ICONS: Record<string, { icon: any; color: string }> = {
  google: { icon: Global, color: '#DB4437' },
  apple: { icon: Global, color: '#000000' },
  facebook: { icon: Global, color: '#1877F2' },
  airline: { icon: Airplane, color: '#3FC39E' },
  hotel: { icon: Building, color: '#6366F1' },
  car_rental: { icon: Car, color: '#F59E0B' },
};

export default function ConnectedAppsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const { profile } = useAuth();
  const { user: clerkUser } = useUser();
  const { showError } = require('@/contexts/ToastContext').useToast();
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConnectedApps();
  }, [profile?.id]);

  const loadConnectedApps = async () => {
    setIsLoading(true);
    try {
      if (profile?.id) {
        const { data } = await supabase
          .from('linked_travel_accounts')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        
        setLinkedAccounts(data || []);
      }
    } catch {
      // Silently handle — table may not have data yet
    } finally {
      setIsLoading(false);
    }
  };

  // Get SSO connections from Clerk
  const ssoConnections = clerkUser?.externalAccounts?.map(account => ({
    provider: String(account.provider || 'unknown'),
    label: String(account.provider) === 'oauth_google' ? 'Google' 
         : String(account.provider) === 'oauth_apple' ? 'Apple'
         : String(account.provider) === 'oauth_facebook' ? 'Facebook'
         : String(account.provider),
    email: account.emailAddress || '',
    connected: true,
  })) || [];

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleDisconnect = (accountId: string, providerName: string) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${providerName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('linked_travel_accounts')
                .delete()
                .eq('id', accountId);
              
              setLinkedAccounts(prev => prev.filter(a => a.id !== accountId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              showError('Failed to disconnect. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Connected Apps</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sign-In Methods (from Clerk) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Sign-In Methods</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            Accounts used to sign in to Guidera
          </Text>

          <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
            {ssoConnections.length > 0 ? (
              ssoConnections.map((connection, index) => {
                const providerKey = connection.provider.replace('oauth_', '');
                const config = PROVIDER_ICONS[providerKey] || { icon: Global, color: tc.textSecondary };
                const Icon = config.icon;
                return (
                  <View 
                    key={`sso-${index}`} 
                    style={[
                      styles.accountRow, 
                      index < ssoConnections.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.borderSubtle }
                    ]}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: `${config.color}15` }]}>
                      <Icon size={20} color={config.color} variant="Bold" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: tc.textPrimary }]}>{connection.label}</Text>
                      {connection.email ? (
                        <Text style={[styles.accountEmail, { color: tc.textSecondary }]}>{connection.email}</Text>
                      ) : null}
                    </View>
                    <View style={[styles.connectedBadge, { backgroundColor: `${tc.success}15` }]}>
                      <TickCircle size={14} color={tc.success} variant="Bold" />
                      <Text style={[styles.connectedText, { color: tc.success }]}>Connected</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyRow}>
                <Text style={[styles.emptyText, { color: tc.textTertiary }]}>
                  No SSO connections. You signed in with email or phone.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Linked Travel Accounts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Travel Accounts</Text>
          <Text style={[styles.sectionSubtitle, { color: tc.textSecondary }]}>
            Linked accounts for importing bookings
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={tc.primary} style={{ marginTop: spacing.lg }} />
          ) : linkedAccounts.length > 0 ? (
            <View style={[styles.card, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              {linkedAccounts.map((account, index) => {
                const config = PROVIDER_ICONS[account.provider] || { icon: Link21, color: tc.textSecondary };
                const Icon = config.icon;
                return (
                  <View 
                    key={account.id} 
                    style={[
                      styles.accountRow, 
                      index < linkedAccounts.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.borderSubtle }
                    ]}
                  >
                    <View style={[styles.accountIcon, { backgroundColor: `${config.color}15` }]}>
                      <Icon size={20} color={config.color} variant="Bold" />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={[styles.accountName, { color: tc.textPrimary }]}>{account.provider_name}</Text>
                      {account.account_email ? (
                        <Text style={[styles.accountEmail, { color: tc.textSecondary }]}>{account.account_email}</Text>
                      ) : null}
                      {account.last_synced_at ? (
                        <Text style={[styles.accountMeta, { color: tc.textTertiary }]}>
                          Last synced {new Date(account.last_synced_at).toLocaleDateString()}
                        </Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      style={[styles.disconnectBtn, { backgroundColor: `${tc.error}10` }]}
                      onPress={() => handleDisconnect(account.id, account.provider_name)}
                      activeOpacity={0.7}
                    >
                      <CloseCircle size={16} color={tc.error} variant="Bold" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: tc.bgElevated, borderColor: tc.borderSubtle }]}>
              <Link21 size={32} color={tc.textTertiary} variant="Outline" />
              <Text style={[styles.emptyTitle, { color: tc.textSecondary }]}>No linked accounts</Text>
              <Text style={[styles.emptySubtitle, { color: tc.textTertiary }]}>
                When you import trips via email or connect travel platforms, they'll appear here.
              </Text>
            </View>
          )}
        </View>

        {/* Info Note */}
        <View style={[styles.infoCard, { backgroundColor: `${tc.primary}08`, borderColor: `${tc.primary}20` }]}>
          <Text style={[styles.infoText, { color: tc.textSecondary }]}>
            Connected apps can only access the data you explicitly share. You can disconnect them at any time.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  accountEmail: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  accountMeta: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  connectedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  disconnectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyRow: {
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
    textAlign: 'center',
  },
});

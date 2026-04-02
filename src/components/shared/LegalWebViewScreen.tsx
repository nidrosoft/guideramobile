import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft2 } from 'iconsax-react-native';
import * as Haptics from 'expo-haptics';
import { spacing, typography } from '@/styles';
import { useTheme } from '@/context/ThemeContext';

interface LegalWebViewScreenProps {
  title: string;
  url: string;
}

const INJECTED_JS = `
  (function() {
    function hideChrome() {
      var css = document.createElement('style');
      css.textContent = [
        'header, footer, nav, .navbar, .footer,',
        '[class*="header" i], [class*="footer" i], [class*="nav" i],',
        '[class*="Header"], [class*="Footer"], [class*="Nav"],',
        '[class*="Navbar"], [class*="navbar"],',
        '[class*="waitlist" i], [class*="Waitlist"],',
        '[class*="cta" i], [class*="banner" i],',
        '[role="navigation"], [role="banner"], [role="contentinfo"]',
        '{ display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; margin: 0 !important; padding: 0 !important; }',
      ].join(' ');
      document.head.appendChild(css);

      var tags = ['header','footer','nav'];
      tags.forEach(function(tag) {
        document.querySelectorAll(tag).forEach(function(el) {
          el.style.display = 'none';
          el.remove();
        });
      });

      document.querySelectorAll('a, button, div, section').forEach(function(el) {
        var text = (el.textContent || '').toLowerCase().trim();
        if (text === 'join the waitlist' || text === 'join waitlist') {
          var parent = el.closest('div') || el.closest('section') || el;
          if (parent && parent !== document.body) {
            var rect = parent.getBoundingClientRect();
            if (rect.top < 120) {
              parent.style.display = 'none';
              if (parent.parentElement && parent.parentElement.getBoundingClientRect().height < 140) {
                parent.parentElement.style.display = 'none';
              }
            } else {
              el.style.display = 'none';
            }
          }
        }
      });

      document.querySelectorAll('img, svg, a').forEach(function(el) {
        var src = (el.getAttribute('src') || el.getAttribute('href') || '').toLowerCase();
        var alt = (el.getAttribute('alt') || '').toLowerCase();
        var cls = (el.className || '').toLowerCase();
        if (alt.includes('logo') || alt.includes('guidera') || cls.includes('logo') || src.includes('logo')) {
          var container = el.closest('div') || el.closest('a') || el;
          if (container && container.getBoundingClientRect().top < 120) {
            var wrapper = container.parentElement;
            if (wrapper && wrapper.getBoundingClientRect().height < 140) {
              wrapper.style.display = 'none';
            } else {
              container.style.display = 'none';
            }
          }
        }
      });

      var firstChild = document.body.firstElementChild;
      if (firstChild) {
        var rect = firstChild.getBoundingClientRect();
        if (rect.height < 140 && rect.height > 20) {
          var hasLink = firstChild.querySelector('a[href="/"], a[href*="waitlist"], img, svg');
          if (hasLink) {
            firstChild.style.display = 'none';
          }
        }
      }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      hideChrome();
      setTimeout(hideChrome, 300);
      setTimeout(hideChrome, 800);
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        hideChrome();
        setTimeout(hideChrome, 300);
        setTimeout(hideChrome, 800);
      });
    }

    new MutationObserver(function() { hideChrome(); })
      .observe(document.body, { childList: true, subtree: true });
  })();
  true;
`;

export default function LegalWebViewScreen({ title, url }: LegalWebViewScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: tc, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: isDark ? '#1A1A1A' : tc.white, borderBottomColor: tc.borderSubtle }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft2 size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={tc.primary} />
        </View>
      )}

      {hasError ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: tc.textSecondary }]}>
            Unable to load content. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tc.primary }]}
            onPress={() => { setHasError(false); setIsLoading(true); webViewRef.current?.reload(); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          style={[styles.webview, { backgroundColor: tc.background }]}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => { setIsLoading(false); setHasError(true); }}
          onHttpError={() => { setIsLoading(false); setHasError(true); }}
          injectedJavaScript={INJECTED_JS}
          showsVerticalScrollIndicator={false}
          startInLoadingState={false}
          javaScriptEnabled
          domStorageEnabled
          allowsBackForwardNavigationGestures={false}
          scrollEnabled
          contentInsetAdjustmentBehavior="automatic"
        />
      )}
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
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  retryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});

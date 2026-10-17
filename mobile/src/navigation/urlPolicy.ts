/**
 * RouteX WebView Navigation Security Policy
 * Ensures the WebView remains a strict security boundary.
 */

import { Linking } from 'react-native';

export type NavigationDecision = {
  allowInWebView: boolean;
  handledExternally: boolean;
  reason: string;
};

/**
 * List of explicitly approved authentication or OAuth redirect origins (if any).
 * Kept strictly scoped. Currently RouteX uses session authentication on the same origin.
 */
const APPROVED_AUTH_ORIGINS: string[] = [];

/**
 * Evaluates whether a requested URL should load inside the RouteX WebView,
 * open in the external system browser, or be blocked for security.
 */
export function evaluateNavigation(
  targetUrl: string,
  allowedOrigin: string
): NavigationDecision {
  if (!targetUrl) {
    return {
      allowInWebView: false,
      handledExternally: false,
      reason: 'Empty URL',
    };
  }

  // Allow about:blank which WebView uses for initialization
  if (targetUrl === 'about:blank' || targetUrl === 'about:blank#') {
    return {
      allowInWebView: true,
      handledExternally: false,
      reason: 'Internal blank initialization',
    };
  }

  try {
    const parsed = new URL(targetUrl);
    const protocol = parsed.protocol.toLowerCase();

    // Block dangerous or unexpected schemes
    if (
      protocol === 'javascript:' ||
      protocol === 'file:' ||
      protocol === 'data:' ||
      protocol === 'vbscript:'
    ) {
      return {
        allowInWebView: false,
        handledExternally: false,
        reason: `Blocked unsafe protocol: ${protocol}`,
      };
    }

    // Handle intent-based standard schemes (tel, mailto, sms)
    if (protocol === 'tel:' || protocol === 'mailto:' || protocol === 'sms:') {
      Linking.openURL(targetUrl).catch(() => {});
      return {
        allowInWebView: false,
        handledExternally: true,
        reason: `Delegated to system application: ${protocol}`,
      };
    }

    // Only allow http and https from this point
    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        allowInWebView: false,
        handledExternally: false,
        reason: `Blocked non-web protocol: ${protocol}`,
      };
    }

    const targetOrigin = parsed.origin.toLowerCase();
    const normalizedAllowedOrigin = allowedOrigin.toLowerCase();

    // 1. Same origin as the configured RouteX web app
    if (targetOrigin === normalizedAllowedOrigin) {
      return {
        allowInWebView: true,
        handledExternally: false,
        reason: 'Allowed RouteX origin navigation',
      };
    }

    // 2. Approved authentication origins (if configured)
    if (APPROVED_AUTH_ORIGINS.includes(targetOrigin)) {
      return {
        allowInWebView: true,
        handledExternally: false,
        reason: 'Allowed approved authentication origin',
      };
    }

    // 3. External web link: Open safely in system browser
    Linking.openURL(targetUrl).catch(() => {});
    return {
      allowInWebView: false,
      handledExternally: true,
      reason: 'External web link redirected to system browser',
    };
  } catch (err) {
    return {
      allowInWebView: false,
      handledExternally: false,
      reason: `Malformed URL rejected: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

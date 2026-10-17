/**
 * RouteX WebView Component
 * Encapsulates react-native-webview with security boundaries, cookie sharing,
 * geolocation support, file upload handling, and error states.
 */

import React, { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
} from 'react-native-webview/lib/WebViewTypes';
import { evaluateNavigation } from '../navigation/urlPolicy';
import { LoadingScreen } from './LoadingScreen';
import { ErrorScreen } from './ErrorScreen';
import { COLORS } from '../theme/colors';

// React 19 compatibility adapter for react-native-webview component typing
const BaseWebView = WebView as unknown as React.ComponentType<any>;

export interface RouteXWebViewHandle {
  goBack: () => void;
  reload: () => void;
  canGoBack: boolean;
}

interface RouteXWebViewProps {
  webUrl: string;
  allowedOrigin: string;
  onCanGoBackChange?: (canGoBack: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

export const RouteXWebView = forwardRef<RouteXWebViewHandle, RouteXWebViewProps>(
  ({ webUrl, allowedOrigin, onCanGoBackChange, onLoadingChange }, ref) => {
    const internalWebViewRef = useRef<any>(null);
    const [canGoBackState, setCanGoBackState] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [failedUrl, setFailedUrl] = useState(webUrl);

    // Expose control methods to parent via imperative handle
    useImperativeHandle(ref, () => ({
      goBack: () => {
        if (internalWebViewRef.current && canGoBackState) {
          internalWebViewRef.current.goBack();
        }
      },
      reload: () => {
        setHasError(false);
        if (internalWebViewRef.current) {
          internalWebViewRef.current.reload();
        }
      },
      canGoBack: canGoBackState,
    }));

    const handleNavigationStateChange = (navState: WebViewNavigation) => {
      const canBack = navState.canGoBack;
      setCanGoBackState(canBack);
      onCanGoBackChange?.(canBack);
      onLoadingChange?.(navState.loading);
    };

    const handleShouldStartLoad = (request: ShouldStartLoadRequest): boolean => {
      const decision = evaluateNavigation(request.url, allowedOrigin);

      // If navigation should not happen inside the WebView (e.g. external link or unsafe protocol)
      if (!decision.allowInWebView) {
        return false;
      }

      return true;
    };

    const handleError = (syntheticEvent: WebViewErrorEvent) => {
      const { nativeEvent } = syntheticEvent;
      setHasError(true);
      setFailedUrl(nativeEvent.url || webUrl);
      setErrorMessage(
        nativeEvent.description || 'Could not connect to the RouteX server.'
      );
      onLoadingChange?.(false);
    };

    const handleHttpError = (syntheticEvent: WebViewHttpErrorEvent) => {
      const { nativeEvent } = syntheticEvent;
      // Fail on serious HTTP status errors
      if (nativeEvent.statusCode >= 500) {
        setHasError(true);
        setFailedUrl(nativeEvent.url || webUrl);
        setErrorMessage(
          `Server returned an error (HTTP ${nativeEvent.statusCode}). Please try again later.`
        );
        onLoadingChange?.(false);
      }
    };

    const handleRetry = () => {
      setHasError(false);
      setErrorMessage('');
      if (internalWebViewRef.current) {
        internalWebViewRef.current.reload();
      }
    };

    if (hasError) {
      return (
        <ErrorScreen
          title="Connection Error"
          description={errorMessage}
          targetUrl={failedUrl}
          onRetry={handleRetry}
        />
      );
    }

    return (
      <View style={styles.container}>
        <BaseWebView
          ref={internalWebViewRef}
          source={{ uri: webUrl }}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => onLoadingChange?.(true)}
          onLoadEnd={() => onLoadingChange?.(false)}
          onError={handleError}
          onHttpError={handleHttpError}
          renderLoading={() => <LoadingScreen message="Loading RouteX..." />}
          renderError={() => (
            <ErrorScreen
              title="Failed to Load"
              description={errorMessage || 'An error occurred while loading RouteX.'}
              targetUrl={failedUrl}
              onRetry={handleRetry}
            />
          )}
          startInLoadingState={true}
          // Security Settings
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={false}
          mixedContentMode="never"
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          // Geolocation & Media Features
          geolocationEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures={true}
          scalesPageToFit={true}
          style={styles.webView}
        />
      </View>
    );
  }
);

RouteXWebView.displayName = 'RouteXWebView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.offWhite,
  },
});

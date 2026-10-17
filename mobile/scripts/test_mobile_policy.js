/**
 * RouteX Mobile Security & Navigation Unit Test Suite
 * Tests env parsing and navigation security boundaries.
 */

const assert = require('assert');

// 1. Navigation Security Policy Tests
const APPROVED_AUTH_ORIGINS = [];

function evaluateNavigation(targetUrl, allowedOrigin) {
  if (!targetUrl) {
    return {
      allowInWebView: false,
      handledExternally: false,
      reason: 'Empty URL',
    };
  }

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

    if (protocol === 'tel:' || protocol === 'mailto:' || protocol === 'sms:') {
      return {
        allowInWebView: false,
        handledExternally: true,
        reason: `Delegated to system application: ${protocol}`,
      };
    }

    if (protocol !== 'http:' && protocol !== 'https:') {
      return {
        allowInWebView: false,
        handledExternally: false,
        reason: `Blocked non-web protocol: ${protocol}`,
      };
    }

    const targetOrigin = parsed.origin.toLowerCase();
    const normalizedAllowedOrigin = allowedOrigin.toLowerCase();

    if (targetOrigin === normalizedAllowedOrigin) {
      return {
        allowInWebView: true,
        handledExternally: false,
        reason: 'Allowed RouteX origin navigation',
      };
    }

    if (APPROVED_AUTH_ORIGINS.includes(targetOrigin)) {
      return {
        allowInWebView: true,
        handledExternally: false,
        reason: 'Allowed approved authentication origin',
      };
    }

    return {
      allowInWebView: false,
      handledExternally: true,
      reason: 'External web link redirected to system browser',
    };
  } catch (err) {
    return {
      allowInWebView: false,
      handledExternally: false,
      reason: `Malformed URL rejected: ${err.message}`,
    };
  }
}

// 2. URL Config Parsing Tests
function parseWebUrl(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    return {
      isValid: false,
      errorMessage: 'Missing EXPO_PUBLIC_WEB_URL configuration',
    };
  }

  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        errorMessage: `Unsupported URL protocol: "${parsed.protocol}"`,
      };
    }
    if (!parsed.hostname) {
      return {
        isValid: false,
        errorMessage: 'Invalid URL hostname',
      };
    }
    return {
      isValid: true,
      origin: parsed.origin,
      normalizedUrl: rawUrl.trim().replace(/\/+$/, ''),
    };
  } catch (err) {
    return {
      isValid: false,
      errorMessage: `Malformed URL: ${err.message}`,
    };
  }
}

// Execute Test Cases
console.log('--- Running RouteX Mobile Unit Tests ---');

// Test 1: Config parser handles empty URL
const emptyConfig = parseWebUrl('');
assert.strictEqual(emptyConfig.isValid, false, 'Empty config should be invalid');
console.log('✓ Test 1 Passed: Empty URL handled safely');

// Test 2: Config parser rejects unsupported protocol
const ftpConfig = parseWebUrl('ftp://routex.org');
assert.strictEqual(ftpConfig.isValid, false, 'FTP protocol should be rejected');
console.log('✓ Test 2 Passed: Non-HTTP/HTTPS protocol rejected');

// Test 3: Config parser normalizes valid URL with trailing slash
const validConfig = parseWebUrl('http://10.0.2.2:5173///');
assert.strictEqual(validConfig.isValid, true, 'Valid config should be valid');
assert.strictEqual(validConfig.normalizedUrl, 'http://10.0.2.2:5173', 'Trailing slashes should be removed');
assert.strictEqual(validConfig.origin, 'http://10.0.2.2:5173', 'Origin should match');
console.log('✓ Test 3 Passed: Valid URL parsed and normalized');

// Test 4: Navigation policy allows internal RouteX origin
const allowedOrigin = 'http://10.0.2.2:5173';
const internalNav = evaluateNavigation('http://10.0.2.2:5173/map', allowedOrigin);
assert.strictEqual(internalNav.allowInWebView, true, 'Internal navigation must be allowed');
assert.strictEqual(internalNav.handledExternally, false);
console.log('✓ Test 4 Passed: RouteX internal origin allowed');

// Test 5: Navigation policy allows about:blank for initialization
const blankNav = evaluateNavigation('about:blank', allowedOrigin);
assert.strictEqual(blankNav.allowInWebView, true, 'about:blank must be allowed');
console.log('✓ Test 5 Passed: about:blank initialization allowed');

// Test 6: Navigation policy blocks javascript: scheme
const jsNav = evaluateNavigation('javascript:alert(1)', allowedOrigin);
assert.strictEqual(jsNav.allowInWebView, false, 'javascript: scheme must be blocked');
console.log('✓ Test 6 Passed: javascript: scheme blocked');

// Test 7: Navigation policy blocks file: scheme
const fileNav = evaluateNavigation('file:///android_asset/something.html', allowedOrigin);
assert.strictEqual(fileNav.allowInWebView, false, 'file: scheme must be blocked');
console.log('✓ Test 7 Passed: file: scheme blocked');

// Test 8: Navigation policy delegates tel: links
const telNav = evaluateNavigation('tel:+2348012345678', allowedOrigin);
assert.strictEqual(telNav.allowInWebView, false);
assert.strictEqual(telNav.handledExternally, true);
console.log('✓ Test 8 Passed: tel: scheme delegated externally');

// Test 9: Navigation policy redirects external web links
const extNav = evaluateNavigation('https://www.openstreetmap.org/copyright', allowedOrigin);
assert.strictEqual(extNav.allowInWebView, false, 'External domain must not load in authenticated WebView');
assert.strictEqual(extNav.handledExternally, true, 'External link must be handled externally');
console.log('✓ Test 9 Passed: External links redirected to system browser');

// Test 10: Navigation policy rejects malformed URLs
const malformedNav = evaluateNavigation('http://', allowedOrigin);
assert.strictEqual(malformedNav.allowInWebView, false);
console.log('✓ Test 10 Passed: Malformed URLs rejected');

console.log('\nAll 10 RouteX Mobile Tests Passed Successfully! (10/10)');

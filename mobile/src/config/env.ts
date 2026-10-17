/**
 * RouteX Mobile Environment & Web Configuration
 * Manages EXPO_PUBLIC_WEB_URL validation and origin resolution.
 */

export interface WebUrlConfig {
  isValid: boolean;
  rawUrl: string;
  normalizedUrl: string;
  origin: string;
  errorMessage?: string;
  helperText?: string;
}

/**
 * Validates and extracts origin details from EXPO_PUBLIC_WEB_URL
 */
export function getWebUrlConfig(): WebUrlConfig {
  const rawUrl = process.env.EXPO_PUBLIC_WEB_URL?.trim() || '';

  if (!rawUrl) {
    return {
      isValid: false,
      rawUrl: '',
      normalizedUrl: '',
      origin: '',
      errorMessage: 'Missing EXPO_PUBLIC_WEB_URL configuration',
      helperText:
        'Please create a .env file in the mobile directory with EXPO_PUBLIC_WEB_URL pointing to your RouteX web application.',
    };
  }

  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        rawUrl,
        normalizedUrl: '',
        origin: '',
        errorMessage: `Unsupported URL protocol: "${parsed.protocol}"`,
        helperText: 'RouteX web URL must use either http:// or https://.',
      };
    }

    if (!parsed.hostname) {
      return {
        isValid: false,
        rawUrl,
        normalizedUrl: '',
        origin: '',
        errorMessage: 'Invalid URL hostname',
        helperText: 'The configured URL does not have a valid hostname.',
      };
    }

    // Origin includes protocol + hostname + port
    const origin = parsed.origin;
    // Normalized URL without trailing slash
    const normalizedUrl = rawUrl.replace(/\/+$/, '');

    return {
      isValid: true,
      rawUrl,
      normalizedUrl,
      origin,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      rawUrl,
      normalizedUrl: '',
      origin: '',
      errorMessage: `Malformed URL: ${message}`,
      helperText: 'Ensure EXPO_PUBLIC_WEB_URL is a complete, well-formed URL (e.g., http://10.0.2.2:5173 or https://routex.app).',
    };
  }
}

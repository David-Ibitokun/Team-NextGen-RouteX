import React, { useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  Locate,
  Plus,
  Minus,
  Layers,
  AlertCircle,
  RefreshCw,
  MapPin,
  List,
  Map as MapIcon,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { HazardItem } from '../constants/hazardTypes';

const BaseWebView = WebView as unknown as React.ComponentType<any>;

interface NativeMapScreenProps {
  hazards: HazardItem[];
  onSelectHazard?: (hazard: HazardItem) => void;
}

export const NativeMapScreen: React.FC<NativeMapScreenProps> = ({ hazards, onSelectHazard }) => {
  const { isDark, theme } = useTheme();
  const webViewRef = useRef<any>(null);
  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(1);
  const [displayMode, setDisplayMode] = useState<'map' | 'cards'>('map');
  const [isMapReady, setIsMapReady] = useState(false);

  // Map tile URLs
  // CartoDB Voyager for light mode, CartoDB Dark Matter for dark mode
  const cartoApiKey =
    process.env.EXPO_PUBLIC_CARTO_API_KEY ||
    process.env.CARTO_API_KEY ||
    'cb1_4net_1_ce38ac6484e32f062aca6913';
  const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : '';

  const tileUrl = isDark
    ? `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${keyParam}`
    : `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyParam}`;

  const tileAttribution = '&copy; OpenStreetMap contributors &copy; CARTO';

  // Generate self-contained Leaflet HTML with embedded CSS and bundle
  const leafletHtml = useMemo(() => {
    const hazardsJson = JSON.stringify(
      hazards.map((h) => ({
        id: h.id,
        category: h.category,
        status: h.status,
        location: h.location_name || 'Road Hazard',
        description: h.description,
        lat: Number(h.latitude) || 6.5244,
        lng: Number(h.longitude) || 3.3792,
      }))
    );

    const bgMap = isDark ? '#0F172A' : '#F8FAFC';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>RouteX Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: ${bgMap};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #map {
      width: 100vw;
      height: 100vh;
      background: ${bgMap};
    }
    .custom-marker {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 14px;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      cursor: pointer;
    }
    .custom-marker svg {
      width: 18px;
      height: 18px;
      stroke: #ffffff;
      stroke-width: 2.5;
      fill: none;
    }
    .leaflet-popup-content-wrapper {
      background: ${isDark ? '#142533' : '#FFFFFF'};
      color: ${isDark ? '#F1F5F9' : '#142B3B'};
      border-radius: 14px;
      border: 1px solid ${isDark ? '#2E4C66' : '#DCE4E8'};
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      padding: 6px;
    }
    .leaflet-popup-tip {
      background: ${isDark ? '#142533' : '#FFFFFF'};
    }
    .popup-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .popup-title {
      font-weight: 800;
      font-size: 13px;
      color: ${isDark ? '#FFFFFF' : '#142B3B'};
      margin-bottom: 4px;
      line-height: 17px;
    }
    .popup-desc {
      font-size: 11px;
      line-height: 15px;
      color: ${isDark ? '#94A3B8' : '#475569'};
      margin-bottom: 6px;
    }
    .popup-coords {
      font-size: 10px;
      font-family: monospace;
      color: ${isDark ? '#64748B' : '#94A3B8'};
    }
  </style>
</head>
<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Global fallback error handler
    window.onerror = function(msg, url, line) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', details: msg + ' at line ' + line }));
      }
    };

    var mapInstance = null;
    var markersLayer = null;

    function getCategorySvg(category) {
      switch (category) {
        case 'flooding':
          return '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>';
        case 'pothole':
          return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>';
        case 'blocked_road':
          return '<svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
        case 'fallen_tree':
          return '<svg viewBox="0 0 24 24"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2a1 1 0 0 1-.8-1.7L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17z"/><path d="M12 22v-3"/></svg>';
        default:
          return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      }
    }

    function initMap() {
      if (typeof L === 'undefined') {
        setTimeout(initMap, 150);
        return;
      }

      if (mapInstance) return;

      try {
        mapInstance = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          tap: true,
          fadeAnimation: true,
        }).setView([6.5244, 3.3792], 12);

        L.tileLayer('${tileUrl}', {
          maxZoom: 19,
          subdomains: 'abcd',
          attribution: '${tileAttribution}'
        }).addTo(mapInstance);

        var colors = {
          flooding: '#087F8C',
          pothole: '#F2B544',
          blocked_road: '#D64545',
          fallen_tree: '#27865B',
          other: '#667784'
        };

        var items = ${hazardsJson};
        var bounds = [];

        items.forEach(function(item) {
          var color = colors[item.category] || '#087F8C';
          var svgIcon = getCategorySvg(item.category);

          var customIcon = L.divIcon({
            className: 'marker-container',
            html: '<div class="custom-marker" style="background-color: ' + color + ';">' + svgIcon + '</div>',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -18]
          });

          var marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(mapInstance);

          var popupContent =
            '<div class="popup-badge" style="background-color: ' + color + '22; color: ' + color + ';">' + item.category.replace('_', ' ') + '</div>' +
            '<div class="popup-title">' + (item.location || 'Road Hazard') + '</div>' +
            '<div class="popup-desc">' + item.description + '</div>' +
            '<div class="popup-coords">GPS: ' + item.lat.toFixed(4) + ', ' + item.lng.toFixed(4) + '</div>';

          marker.bindPopup(popupContent);
          bounds.push([item.lat, item.lng]);
        });

        if (bounds.length > 0) {
          mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }

        // Force map size invalidation after WebView measures
        setTimeout(function() {
          if (mapInstance) mapInstance.invalidateSize();
        }, 200);

        setTimeout(function() {
          if (mapInstance) mapInstance.invalidateSize();
        }, 800);

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready', count: items.length }));
        }

        window.mapZoomIn = function() { if (mapInstance) mapInstance.zoomIn(); };
        window.mapZoomOut = function() { if (mapInstance) mapInstance.zoomOut(); };
        window.mapCenterBounds = function() {
          if (mapInstance) {
            if (bounds.length > 0) {
              mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            } else {
              mapInstance.setView([6.5244, 3.3792], 12);
            }
          }
        };
      } catch (err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', details: String(err) }));
        }
      }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initMap();
    } else {
      window.addEventListener('DOMContentLoaded', initMap);
      window.addEventListener('load', initMap);
    }
  </script>
</body>
</html>`;
  }, [hazards, isDark, tileUrl]);

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('window.mapZoomIn && window.mapZoomIn(); true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('window.mapZoomOut && window.mapZoomOut(); true;');
  };

  const handleRecenter = () => {
    webViewRef.current?.injectJavaScript('window.mapCenterBounds && window.mapCenterBounds(); true;');
  };

  const reloadMap = () => {
    setLoadError(false);
    setIsMapReady(false);
    setKey((prev) => prev + 1);
  };

  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setIsMapReady(true);
      } else if (data.type === 'error') {
        // Fallback gracefully
        setLoadError(true);
      }
    } catch {
      // Non-JSON message ignored
    }
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Map Bar with View Toggle & Live Hazards Pill */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.badgeRow}>
          <Layers size={14} color={theme.teal} />
          <Text style={[styles.badgeText, { color: theme.textPrimary }]}>
            {hazards.length} Monitored Hazards
          </Text>
        </View>

        {/* View Mode Toggle: Interactive Map vs Hazard Cards */}
        <View style={[styles.modeToggle, { backgroundColor: theme.surfaceSubtle, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              displayMode === 'map' && [styles.modeBtnActive, { backgroundColor: theme.teal }],
            ]}
            onPress={() => setDisplayMode('map')}
            activeOpacity={0.7}
          >
            <MapIcon size={14} color={displayMode === 'map' ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                styles.modeBtnText,
                { color: displayMode === 'map' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              displayMode === 'cards' && [styles.modeBtnActive, { backgroundColor: theme.teal }],
            ]}
            onPress={() => setDisplayMode('cards')}
            activeOpacity={0.7}
          >
            <List size={14} color={displayMode === 'cards' ? '#FFFFFF' : theme.textMuted} />
            <Text
              style={[
                styles.modeBtnText,
                { color: displayMode === 'cards' ? '#FFFFFF' : theme.textMuted },
              ]}
            >
              Cards
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content: Map or Cards */}
      {displayMode === 'cards' ? (
        <FlatList
          data={hazards}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.cardListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.hazardRowCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              activeOpacity={0.7}
              onPress={() => {
                setDisplayMode('map');
                if (onSelectHazard) onSelectHazard(item);
              }}
            >
              <View style={[styles.cardDot, { backgroundColor: theme.teal }]} />
              <View style={styles.cardMeta}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.location_name || 'Road Hazard'}
                  </Text>
                  <Text style={[styles.cardCategory, { color: theme.teal }]}>
                    {item.category.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.cardDesc, { color: theme.textMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardGpsRow}>
                  <MapPin size={11} color={theme.textMuted} />
                  <Text style={[styles.cardGps, { color: theme.textMuted }]}>
                    {Number(item.latitude || 6.5244).toFixed(4)}, {Number(item.longitude || 3.3792).toFixed(4)}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : loadError ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color="#F87171" />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>Map Unavailable Offline</Text>
          <Text style={[styles.errorSub, { color: theme.textMuted }]}>
            Map tile network connection was interrupted. You can retry loading or browse live hazard coordinates in the Cards view.
          </Text>
          <View style={styles.errorActions}>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: theme.teal }]}
              onPress={reloadMap}
              activeOpacity={0.8}
            >
              <RefreshCw size={14} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry Loading Map</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardsFallbackBtn, { borderColor: theme.border }]}
              onPress={() => setDisplayMode('cards')}
              activeOpacity={0.8}
            >
              <List size={14} color={theme.textPrimary} />
              <Text style={[styles.cardsFallbackText, { color: theme.textPrimary }]}>View Hazard Cards</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <BaseWebView
            key={key}
            ref={webViewRef}
            originWhitelist={['*']}
            source={{
              html: leafletHtml,
            }}
            style={[styles.webview, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
            mixedContentMode="always"
            startInLoadingState={false}
            androidHardwareAccelerationDisabled={false}
            onMessage={handleWebViewMessage}
            onError={() => setLoadError(true)}
          />

          {!isMapReady && (
            <View style={[styles.loader, { backgroundColor: theme.background }]}>
              <ActivityIndicator size="large" color={theme.teal} />
              <Text style={[styles.loadingText, { color: theme.textMuted }]}>
                Rendering Interactive Map...
              </Text>
            </View>
          )}

          {/* Floating Map Controls Overlay */}
          <View style={styles.controlsOverlay}>
            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={handleRecenter}
              activeOpacity={0.8}
              accessibilityLabel="Center map on hazards"
            >
              <Locate size={18} color={theme.teal} />
            </TouchableOpacity>

            <View style={[styles.zoomCluster, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={handleZoomIn}
                activeOpacity={0.7}
                accessibilityLabel="Zoom in"
              >
                <Plus size={18} color={theme.textPrimary} />
              </TouchableOpacity>
              <View style={[styles.zoomDivider, { backgroundColor: theme.borderSubtle }]} />
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={handleZoomOut}
                activeOpacity={0.7}
                accessibilityLabel="Zoom out"
              >
                <Minus size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    elevation: 2,
    zIndex: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeBtnActive: {
    elevation: 1,
  },
  modeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 10,
    alignItems: 'center',
    zIndex: 5,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  zoomCluster: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  zoomBtn: {
    width: 44,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    width: '100%',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  errorActions: {
    gap: 10,
    width: '100%',
    alignItems: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    width: '80%',
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cardsFallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: '80%',
    justifyContent: 'center',
  },
  cardsFallbackText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cardListContent: {
    padding: 16,
    gap: 10,
  },
  hazardRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  cardDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardMeta: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  cardCategory: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  cardGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  cardGps: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

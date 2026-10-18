import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Navigation, MapPin } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';

const BaseWebView = WebView as unknown as React.ComponentType<any>;

interface LocationPickerMapNativeProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
}

export const LocationPickerMapNative: React.FC<LocationPickerMapNativeProps> = ({
  latitude,
  longitude,
  onLocationChange,
  height = 190,
}) => {
  const { isDark, theme } = useTheme();
  const webViewRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const cartoApiKey =
    process.env.EXPO_PUBLIC_CARTO_API_KEY ||
    process.env.CARTO_API_KEY ||
    'cb1_4net_1_ce38ac6484e32f062aca6913';
  const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : '';

  const tileUrl = isDark
    ? `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${keyParam}`
    : `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${keyParam}`;

  const bgMap = isDark ? '#0B161E' : '#F7F9FA';

  // Leaflet map HTML for location picking
  const pickerHtml = useMemo(() => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>RouteX Location Picker</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      width: 100%;
      height: 100%;
      background: ${bgMap};
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .routex-picker-marker {
      width: 32px;
      height: 32px;
      background-color: #087F8C;
      border: 3px solid #FFFFFF;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
    .routex-picker-marker::after {
      content: '';
      width: 9px;
      height: 9px;
      background-color: #FFFFFF;
      border-radius: 50%;
      transform: rotate(45deg);
    }
    .leaflet-control-attribution {
      font-size: 8px !important;
      background: rgba(0,0,0,0.4) !important;
      color: #94A3B8 !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var currentLat = ${latitude};
    var currentLng = ${longitude};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([currentLat, currentLng], 14);

    L.tileLayer('${tileUrl}', {
      maxZoom: 19
    }).addTo(map);

    var pickerIcon = L.divIcon({
      className: '',
      html: '<div class="routex-picker-marker"></div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    var marker = L.marker([currentLat, currentLng], {
      icon: pickerIcon,
      draggable: true
    }).addTo(map);

    function notifyPosition(lat, lng) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOCATION_CHANGED',
          latitude: lat,
          longitude: lng
        }));
      }
    }

    marker.on('dragend', function(e) {
      var pos = marker.getLatLng();
      notifyPosition(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      map.panTo(e.latlng);
      notifyPosition(e.latlng.lat, e.latlng.lng);
    });

    window.updatePosition = function(lat, lng) {
      marker.setLatLng([lat, lng]);
      map.panTo([lat, lng]);
    };

    window.locateMe = function() {
      if (navigator && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            marker.setLatLng([lat, lng]);
            map.panTo([lat, lng]);
            notifyPosition(lat, lng);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GPS_SUCCESS',
                latitude: lat,
                longitude: lng
              }));
            }
          },
          function(err) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'GPS_ERROR',
                message: err.message || 'Unable to retrieve location'
              }));
            }
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      } else if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'GPS_ERROR',
          message: 'Geolocation unavailable'
        }));
      }
    };
  </script>
</body>
</html>`;
  }, [tileUrl, bgMap]);

  // Synchronize pin position if changed externally
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.updatePosition) { window.updatePosition(${latitude}, ${longitude}); } true;`
      );
    }
  }, [latitude, longitude]);

  // Handle postMessage from Leaflet
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOCATION_CHANGED' || data.type === 'GPS_SUCCESS') {
        onLocationChange(Number(data.latitude), Number(data.longitude));
        if (data.type === 'GPS_SUCCESS') {
          setLocationStatus('Current GPS location applied!');
          setLocating(false);
          setTimeout(() => setLocationStatus(''), 3000);
        }
      } else if (data.type === 'GPS_ERROR') {
        setLocationStatus('Could not acquire GPS. Please select position manually.');
        setLocating(false);
        setTimeout(() => setLocationStatus(''), 4000);
      }
    } catch {
      // Ignore parse error
    }
  };

  // Request current GPS location via Leaflet WebView navigator.geolocation
  const handleGetCurrentLocation = () => {
    setLocating(true);
    setLocationStatus('Acquiring location...');

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        'if (window.locateMe) { window.locateMe(); } true;'
      );
      // Timeout after 6 seconds if geolocation does not reply
      setTimeout(() => {
        setLocating(current => {
          if (current) {
            setLocationStatus('Tap map or select a corridor preset below.');
            setTimeout(() => setLocationStatus(''), 4000);
            return false;
          }
          return current;
        });
      }, 6000);
    } else {
      setLocationStatus('Tap map or enter coordinates to set location.');
      setLocating(false);
      setTimeout(() => setLocationStatus(''), 4000);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Actions (Tap to set pin + Use current location) */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MapPin size={12} color={theme.teal} />
          <Text style={[styles.headerLabel, { color: theme.textSecondary }]}>
            Tap map or drag pin to position:
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleGetCurrentLocation}
          disabled={locating}
          style={styles.gpsBtn}
          activeOpacity={0.7}
        >
          {locating ? (
            <ActivityIndicator size="small" color={theme.teal} />
          ) : (
            <Navigation size={13} color={theme.teal} />
          )}
          <Text style={[styles.gpsBtnText, { color: theme.teal }]}>
            {locating ? 'Locating...' : 'Use current location'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* GPS Status Message if any */}
      {locationStatus ? (
        <Text style={[styles.statusMsg, { color: theme.teal }]}>{locationStatus}</Text>
      ) : null}

      {/* Map Preview WebView Container */}
      <View
        style={[
          styles.mapWrapper,
          {
            height,
            backgroundColor: theme.surfaceSubtle,
            borderColor: theme.border,
          },
        ]}
      >
        <BaseWebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: pickerHtml }}
          style={styles.webView}
          onMessage={handleMessage}
          scrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          cacheEnabled={true}
          geolocationEnabled={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  gpsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusMsg: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: -2,
  },
  mapWrapper: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

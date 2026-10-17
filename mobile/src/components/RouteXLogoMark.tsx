import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

interface RouteXLogoMarkProps {
  size?: number;
}

export const RouteXLogoMark: React.FC<RouteXLogoMarkProps> = ({ size = 34 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="mobile-routex-logo-grad" x1="5.5" y1="2.5" x2="42.5" y2="46.8" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#0AA3B3" />
            <Stop offset="100%" stopColor="#087F8C" />
          </LinearGradient>
        </Defs>

        {/* Map Pin Base */}
        <Path
          d="M24 2.5C13.8 2.5 5.5 10.8 5.5 21c0 13.4 15.4 23.9 17.9 25.5a1.6 1.6 0 0 0 1.2.3c2.5-1.6 17.9-12.1 17.9-25.8C42.5 10.8 34.2 2.5 24 2.5z"
          fill="url(#mobile-routex-logo-grad)"
        />

        {/* Road Surface */}
        <Path
          d="M21.4 38.5C21.4 31 28.2 29.2 28.2 22.6 28.2 18.6 24.4 17.4 24.4 12.4"
          stroke="#FFFFFF"
          strokeWidth="5.6"
          strokeLinecap="round"
        />

        {/* Center Lane Markings */}
        <Path
          d="M21.4 38.5C21.4 31 28.2 29.2 28.2 22.6 28.2 18.6 24.4 17.4 24.4 12.4"
          stroke="#087F8C"
          strokeWidth="1.2"
          strokeDasharray="2.4, 2.2"
          strokeLinecap="round"
        />

        {/* Destination Waypoint */}
        <Circle cx="24.4" cy="11" r="3.6" fill="#FFFFFF" />
        <Circle cx="24.4" cy="11" r="1.6" fill="#087F8C" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

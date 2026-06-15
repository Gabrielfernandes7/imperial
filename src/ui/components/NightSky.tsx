import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Generate random stars
const STARS_COUNT = 50;
const stars = Array.from({ length: STARS_COUNT }).map((_, i) => ({
  id: i,
  x: Math.random() * width,
  y: Math.random() * height,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
}));

// Cruzeiro do Sul coordinates (normalized 0-100)
const CRUZEIRO_DO_SUL = [
  { x: 50, y: 20, size: 4, name: 'Gacrux' },      // Top
  { x: 50, y: 80, size: 5, name: 'Acrux' },      // Bottom
  { x: 20, y: 45, size: 4.5, name: 'Mimosa' },   // Left
  { x: 75, y: 45, size: 3.5, name: 'Imai' },     // Right
  { x: 65, y: 55, size: 2, name: 'Intrometida' } // Middle-Right
];

export function NightSky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Background stars */}
        {stars.map((star) => (
          <Circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill="white"
            fillOpacity={star.opacity}
          />
        ))}

        {/* Cruzeiro do Sul */}
        <G transform={`translate(${width * 0.1}, ${height * 0.1}) scale(${Math.min(width, height) * 0.003})`}>
           {CRUZEIRO_DO_SUL.map((star, i) => (
             <G key={i}>
                {/* Glow */}
                <Circle
                  cx={star.x * 2}
                  cy={star.y * 2}
                  r={star.size * 2}
                  fill="white"
                  fillOpacity={0.15}
                />
                {/* Star */}
                <Circle
                  cx={star.x * 2}
                  cy={star.y * 2}
                  r={star.size}
                  fill={star.name === 'Gacrux' ? '#FFD27D' : '#FFFFFF'} // Gacrux is slightly orange
                />
             </G>
           ))}
        </G>
      </Svg>
    </View>
  );
}

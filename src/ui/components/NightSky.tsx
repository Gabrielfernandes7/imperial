import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, G, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Gerar estrelas com variação de cor e cintilação simulada (via opacidade)
const STARS_COUNT = 80; // Aumentado para mais densidade
const stars = Array.from({ length: STARS_COUNT }).map((_, i) => {
  const types = ['#FFFFFF', '#E2E8F0', '#FFF4E8', '#E0F2FE']; // Branco, Azulado, Amarelado
  return {
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.5 + 0.3,
    opacity: Math.random() * 0.5 + 0.2,
    color: types[Math.floor(Math.random() * types.length)],
  };
});

// Cruzeiro do Sul com cores astronômicas reais
const CRUZEIRO_DO_SUL = [
  { x: 50, y: 20, size: 4, name: 'Gacrux', color: '#FFB86C' },      // Topo (Gigante Vermelha/Laranja)
  { x: 50, y: 80, size: 5, name: 'Acrux', color: '#B0E0E6' },       // Fundo (Estrela Azul-Branca)
  { x: 20, y: 45, size: 4.5, name: 'Mimosa', color: '#B0E0E6' },    // Esquerda (Azul)
  { x: 75, y: 45, size: 3.5, name: 'Imai', color: '#B0E0E6' },      // Direita (Azul)
  { x: 62, y: 58, size: 1.8, name: 'Intrometida', color: '#FFFFFF' } // Meio (Menor)
];

export function NightSky() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg height="100%" width="100%">
        <Defs>
          <RadialGradient
            id="skyGradient"
            cx="50%"
            cy="40%"
            rx="70%"
            ry="70%"
            fx="50%"
            fy="40%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#0A1633" stopOpacity="1" />
            <Stop offset="100%" stopColor="#020408" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Fundo com Gradiente Atmosférico */}
        <Rect width="100%" height="100%" fill="url(#skyGradient)" />

        {/* Estrelas de fundo */}
        {stars.map((star) => (
          <Circle
            key={star.id}
            cx={star.x}
            cy={star.y}
            r={star.size}
            fill={star.color}
            fillOpacity={star.opacity}
          />
        ))}

        {/* Cruzeiro do Sul Refinado */}
        <G transform={`translate(${width * 0.15}, ${height * 0.15}) scale(${Math.min(width, height) * 0.0035})`}>
           {CRUZEIRO_DO_SUL.map((star, i) => (
             <G key={i}>
                {/* Glow Atmosférico da estrela */}
                <Circle
                  cx={star.x * 2}
                  cy={star.y * 2}
                  r={star.size * 3}
                  fill={star.color}
                  fillOpacity={0.12}
                />
                {/* Núcleo da estrela */}
                <Circle
                  cx={star.x * 2}
                  cy={star.y * 2}
                  r={star.size}
                  fill={star.color}
                />
             </G>
           ))}
        </G>
      </Svg>
    </View>
  );
}

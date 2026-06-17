/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        imperial: {
          gold: '#C9A227',
          green: '#1E5631',
          cream: '#F5F0E6',
          brown: '#5E412F',
        },
        background: '#FAF8F3',
        text: '#1A1A1A',
        night: {
          void: '#020408',    // Quase preto, para máxima profundidade
          deep: '#050B18',    // Azul meia-noite base
          mid: '#0B1328',     // Superfície escura sólida para cards e modais
          accent: '#142247',  // Camada decorativa escura com contraste suficiente
          dust: '#1A2238',    // Azul poeira estelar para camadas médias
          star: '#E2E8F0',    // Cor das estrelas (off-white azulado)
          glow: 'rgba(100, 149, 237, 0.3)', // Brilho azul suave
        },
      },
    },
  },
  plugins: [],
}

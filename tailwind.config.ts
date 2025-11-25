import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette de couleurs du projet
        slate: {
          750: '#1e293b', // Background panel
          850: '#0f172a', // Background avancé
        },
        gray: {
          650: '#475569', // Bordures
          700: '#334155', // Bordures secondaires
          750: '#64748b', // Texte secondaire
          850: '#94a3b8', // Labels
        },
        blue: {
          350: '#90caf9', // Accent principal
          400: '#64b5f6', // Accent hover
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: [
          'source-code-pro',
          'Menlo',
          'Monaco',
          'Consolas',
          'Courier New',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
} satisfies Config

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#3b82f6',
          DEFAULT: '#1d4ed8', // Royal Blue
          dark: '#1e3a8a',
        },
        royal: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8', // Primary Royal Blue
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Accent Golden Yellow
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        slate: {
          55: '#f4f7fa',
          205: '#d6dee8',
          250: '#d6dee8',
          255: '#d3dbe6',
          350: '#afbcd0',
          405: '#7e8da1',
          440: '#78879b',
          450: '#7c8ba0',
          455: '#7a899e',
          550: '#55647a',
          605: '#3d4b5f',
          650: '#3d4b5f',
          705: '#283548',
          750: '#243043',
          805: '#172032',
          850: '#111827',
          855: '#101726',
          880: '#0b0f19',
          905: '#090e1e',
          955: '#060814',
        },
        cyan: {
          205: '#93c5fd',
          450: '#2563eb',
          650: '#1d4ed8',
          755: '#1e40af',
        },
        rose: {
          450: '#f75871',
          550: '#ea2e53',
          655: '#cf1742',
          850: '#931238',
        },
        amber: {
          450: '#f8ad18',
        },
        emerald: {
          250: '#8ae6c3',
          450: '#22c68d',
          550: '#0ba775',
        },
        green: {
          550: '#1cb454',
          555: '#1bb353',
        },
        violet: {
          750: '#6424c7',
        },
        tvrs: {
          accent: {
            light: '#fbbf24',
            DEFAULT: '#f59e0b', // Golden Yellow
            dark: '#d97706',
          },
          primary: {
            light: '#3b82f6',
            DEFAULT: '#1d4ed8', // Royal Blue
            dark: '#1e3a8a',
          },
          bg: {
            light: '#ffffff', // Pure White background
            dark: '#0f172a',
          },
          surface: {
            light: '#ffffff',
            dark: '#1e293b',
          },
          card: {
            light: '#ffffff',
            dark: 'rgba(30, 41, 59, 0.75)',
          },
          border: {
            light: 'rgba(226, 232, 240, 0.9)',
            dark: 'rgba(255, 255, 255, 0.08)',
          },
          text: {
            light: '#0f172a', // Dark Gray / Near Black
            dark: '#f8fafc',
            mutedLight: '#64748b',
            mutedDark: '#94a3b8',
          }
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'premium-light': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)',
        'premium-dark': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 1px 3px 0 rgba(0, 0, 0, 0.3)',
        'glow-cyan': '0 0 16px rgba(29, 78, 216, 0.15)',
        'glow-cyan-strong': '0 0 25px rgba(29, 78, 216, 0.25)',
        'glow-blue': '0 0 16px rgba(29, 78, 216, 0.15)',
        'glow-gold': '0 0 16px rgba(245, 158, 11, 0.2)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

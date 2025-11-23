// js/tailwind/config.js

// IMPORTANT: no `export`, no `import`, no `type="module"`
// Tailwind CDN just looks for a global `tailwind.config` object.

tailwind.config = {
  theme: {
    extend: {
      // 1. Website Color Palette
      colors: {
        cream: '#FAF8F5',
        'accent-pink': '#FBCFE8',
        'accent-tan': 'rgba(253, 230, 138, 0.8)', // warmer tan
        'accent-gray': '#E5E7EB',
      },

      // 2. Two Different Blob Animations
      keyframes: {
        'blob-1': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'blob-2': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-80px, 30px) scale(1.2)' },
          '66%': { transform: 'translate(40px, -60px) scale(0.8)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
      },

      // 3. Register Animations
      animation: {
        'blob-1': 'blob-1 10s infinite ease-in-out',
        'blob-2': 'blob-2 12s infinite ease-in-out',
      },
    },
  },
};

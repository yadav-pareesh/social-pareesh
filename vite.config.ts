import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || ''),
      'process.env.VITE_SOCKET_URL': JSON.stringify(env.VITE_SOCKET_URL || ''),
      'process.env.VITE_IMAGEKIT_PUBLIC_KEY': JSON.stringify(env.VITE_IMAGEKIT_PUBLIC_KEY || ''),
      'process.env.VITE_IMAGEKIT_URL_ENDPOINT': JSON.stringify(env.VITE_IMAGEKIT_URL_ENDPOINT || ''),
      'process.env.VITE_STUN_SERVER': JSON.stringify(env.VITE_STUN_SERVER || ''),
      'process.env.VITE_TURN_SERVER': JSON.stringify(env.VITE_TURN_SERVER || ''),
      'process.env.VITE_TURN_USERNAME': JSON.stringify(env.VITE_TURN_USERNAME || ''),
      'process.env.VITE_TURN_CREDENTIAL': JSON.stringify(env.VITE_TURN_CREDENTIAL || ''),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});


import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'


export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: { enabled: true },
      manifest: {
        name: 'BunnyGamez GeneaFlow',
        short_name: 'GeneaFlow',
        description: 'A simple family tree builder',
        theme_color: '#ffffffff',
        background_color: '#ffffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { 
            src: '/macos.png', 
            sizes: 'any', 
            type: 'image/png', 
            purpose: 'any' 
          },
          {
            src: '/ios.png', 
            sizes: 'any', 
            type: 'image/png', 
            purpose: 'maskable' 
          }
        ]
      },
      workbox: {
        // defining cached files formats
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
      }
    })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

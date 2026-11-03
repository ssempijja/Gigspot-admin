import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * In development the panel calls /api and /media on its own origin and Vite
 * forwards them to the local Gigspot API (npm run start:dev in Gigspot-api).
 * A production build calls VITE_API_URL instead.
 */
const API = process.env.GIGSPOT_API ?? 'http://127.0.0.1:8000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: { '/api': API, '/media': API },
  },
});

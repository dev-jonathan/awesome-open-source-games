import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/awesome-open-source-games/' : '/',
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
}));

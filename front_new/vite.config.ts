import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(decodeURIComponent(__filename));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем env-переменные из корневой директории проекта
  const env = loadEnv(mode, './', 'VITE_');
  console.log('Loaded env vars:', env); 

  return {
    envPrefix: 'VITE_',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: { // Добавляем блок resolve
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Опционально: настройка сервера
    server: {
      port: 3000,
      host: true,
      strictPort: true,
    }
  };
});
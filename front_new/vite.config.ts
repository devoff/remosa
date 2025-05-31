import { defineConfig, loadEnv } from 'vite'; // Импортируем loadEnv
import react from '@vitejs/plugin-react';
import path from 'node:path'; // Импортируем path

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => { // Добавляем параметр mode
  // Загружаем env-переменные из корневой директории проекта
  const env = loadEnv(mode, './', 'VITE_');
  console.log('Loaded env vars:', env); 
  return {
    envPrefix: 'VITE_',
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    // Добавляем определение глобальных переменных
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      // Можно добавить другие переменные по аналогии
    },
    resolve: { // Добавляем блок resolve
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Опционально: настройка сервера
    server: {
      port: 3000,
      host: true,  // Доступен не только localhost
      strictPort: true,  // Не менять порт автоматически
    }
  };
});
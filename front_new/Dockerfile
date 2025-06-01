FROM node:18-alpine

ARG VITE_API_URL
ARG VITE_WS_URL

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /app

COPY package*.json ./

# Устанавливаем переменные окружения для Vite во время сборки
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Очистка кеша и установка
# RUN npm cache clean --force && \
#     rm -rf node_modules && \
#     npm install && \
#     npm install -g serve

# Диагностика: Проверяем наличие @types/react
# RUN ls -la node_modules/@types/react

COPY . .

# Перед npm install убедимся, что файл useAuth имеет правильное расширение
# Если useAuth.ts существует, удалим его
# RUN if [ -f src/lib/useAuth.ts ]; then rm src/lib/useAuth.ts; fi
# Если useAuth.tsx не существует, создадим его из содержимого, которое должно было быть
# RUN if [ ! -f src/lib/useAuth.tsx ]; then echo "import React, { useState, useEffect, useContext, createContext } from 'react';\\nimport { useNavigate } from 'react-router-dom';\\nimport { Token } from '../types';\\n\\ninterface AuthContextType {\\n  isAuthenticated: boolean;\\n  login: (token: Token) => void;\\n  logout: () => void;\\n}\\n\\nconst AuthContext = createContext<AuthContextType | undefined>(undefined);\\n\\nexport const AuthProvider = ({ children }: { children: React.ReactNode }) => {\\n  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {\\n    return localStorage.getItem('access_token') !== null;\\n  });\\n  const navigate = useNavigate();\\n\\n  const login = (token: Token) => {\\n    localStorage.setItem('access_token', token.access_token);\\n    setIsAuthenticated(true);\\n  };\\n\\n  const logout = () => {\\n    localStorage.removeItem('access_token');\\n    setIsAuthenticated(false);\\n    navigate('/login');\\n  };\\n\\n  useEffect(() => {\\n    const token = localStorage.getItem('access_token');\\n    if (token) {\\n      setIsAuthenticated(true);\\n    } else {\\n      setIsAuthenticated(false);\\n    }\\n  }, []);\\n\\n  return (\\n    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>\\n      {children}\\n    </AuthContext.Provider>\\n  );\\n};\\n\\nexport const useAuth = () => {\\n  const context = useContext(AuthContext);\\n  if (context === undefined) {\\n    throw new Error('useAuth must be used within an AuthProvider');\\n  }\\n  return context;\\n};" > src/lib/useAuth.tsx; fi

# Устанавливаем зависимости после копирования файлов, чтобы они были в томе
RUN npm install
RUN npm install -g serve

# Диагностика: Проверяем наличие @types/react перед сборкой
RUN ls -la node_modules/@types/react || echo "@types/react not found or error accessing"

# Собираем проект
RUN VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL npm run build

# Проверяем результаты сборки
RUN ls -la dist/
RUN cat dist/index.html || echo "index.html not found in dist"

EXPOSE 3000

# ENV NODE_ENV=development # Удаляем, будет в docker-compose.yml
# ENV GENERATE_SOURCEMAP=false # Удаляем, будет в docker-compose.yml

ENTRYPOINT ["entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "3000"] 
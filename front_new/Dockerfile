FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Очистка кеша и установка
# RUN npm cache clean --force && \
#     rm -rf node_modules && \
#     npm install && \
#     npm install -g serve

# Диагностика: Проверяем наличие @types/react
# RUN ls -la node_modules/@types/react

COPY . .

# Устанавливаем зависимости после копирования файлов, чтобы они были в томе
RUN npm install
RUN npm install -g serve

# Собираем проект
RUN npm run build

# Проверяем результаты сборки
RUN ls -la dist/
RUN cat dist/index.html || echo "index.html not found in dist"

EXPOSE 3000

ENV NODE_ENV=development
ENV GENERATE_SOURCEMAP=false

# Запускаем через npx vite
CMD ["npx", "vite"] 
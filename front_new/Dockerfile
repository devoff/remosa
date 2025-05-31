FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Очистка кеша и установка
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install && \
    npm install -g serve

# Диагностика: Проверяем наличие @types/react
RUN ls -la node_modules/@types/react

COPY . .

# Собираем проект
RUN npm run build

# Проверяем результаты сборки
RUN ls -la dist/
RUN cat dist/index.html || echo "index.html not found in dist"

EXPOSE 3000

ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Запускаем через serve, используя dist
CMD ["npm", "run", "dev"] 
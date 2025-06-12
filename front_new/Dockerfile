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

# Автоматическое создание файлов удалено - все файлы должны быть в репозитории

# Устанавливаем зависимости после копирования файлов, чтобы они были в томе
RUN npm install
RUN npm install -g serve

# Убрано дублированное COPY . .

# Собираем проект
RUN VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL npm run build

EXPOSE 3000

# ENV NODE_ENV=development # Удаляем, будет в docker-compose.yml
# ENV GENERATE_SOURCEMAP=false # Удаляем, будет в docker-compose.yml

ENTRYPOINT ["entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "3000"] 
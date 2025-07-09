FROM node:18-alpine

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /app

COPY package*.json ./

# Устанавливаем зависимости
RUN npm install
RUN npm install -g serve

# Копируем исходный код
COPY . .

# Собираем проект с плейсхолдерами (без реальных переменных окружения)
RUN npm run build

EXPOSE 3000

# Переменные окружения будут переданы при запуске контейнера
ENV VITE_API_URL=""
ENV VITE_WS_URL=""
ENV VITE_DEBUG_LOGGING=""

ENTRYPOINT ["entrypoint.sh"]
CMD ["serve", "-s", "dist", "-l", "3000"] 
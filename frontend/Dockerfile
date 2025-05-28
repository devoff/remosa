FROM node:18-alpine

WORKDIR /app

# Устанавливаем необходимые пакеты
RUN apk add --no-cache python3 make g++

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Открываем порт
EXPOSE 3000

# Устанавливаем переменные окружения для разработки
ENV NODE_ENV=development
ENV WDS_SOCKET_PORT=0
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

# Запускаем приложение в режиме разработки
CMD ["npm", "start"] 
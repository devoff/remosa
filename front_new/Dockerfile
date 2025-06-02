FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Устанавливаем зависимости
RUN npm install
RUN npm install -g serve

COPY . .

# Собираем проект
RUN npm run build

EXPOSE 3000

# Используем переменные окружения из .env
CMD ["npx", "vite"]
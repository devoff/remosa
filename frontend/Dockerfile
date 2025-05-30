FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Очистка кеша и установка с force
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --force --legacy-peer-deps

COPY . .

EXPOSE 3000

ENV NODE_ENV=development
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV GENERATE_SOURCEMAP=false
ENV PORT=3000

CMD ["npm", "run", "start"]
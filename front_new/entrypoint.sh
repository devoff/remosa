#!/bin/sh

# Заменяем плейсхолдеры на значения переменных окружения
# Ищем все .js и .html файлы в папке dist/
for file in /app/dist/*.js /app/dist/*.html; do
  if [ -f "$file" ]; then
    sed -i "s|__VITE_API_URL_PLACEHOLDER__|$VITE_API_URL|g" "$file"
    sed -i "s|__VITE_WS_URL_PLACEHOLDER__|$VITE_WS_URL|g" "$file"
  fi
done

# Запускаем оригинальную команду CMD
exec "$@" 
#!/bin/sh

echo "=== ENTRYPOINT DEBUG ==="
echo "VITE_API_URL: $VITE_API_URL"
echo "VITE_WS_URL: $VITE_WS_URL"
echo "VITE_DEBUG_LOGGING: $VITE_DEBUG_LOGGING"

# Заменяем плейсхолдеры на значения переменных окружения
# Ищем все .js и .html файлы в папке dist/ рекурсивно
find /app/dist -name "*.js" -o -name "*.html" -o -name "*.css" | while read file; do
  if [ -f "$file" ]; then
    echo "Processing file: $file"
    sed -i "s|__VITE_API_URL_PLACEHOLDER__|$VITE_API_URL|g" "$file"
    sed -i "s|__VITE_WS_URL_PLACEHOLDER__|$VITE_WS_URL|g" "$file"
    sed -i "s|__VITE_DEBUG_LOGGING_PLACEHOLDER__|$VITE_DEBUG_LOGGING|g" "$file"
  fi
done

# Также заменяем в config.js в public/
if [ -f "/app/public/config.js" ]; then
  echo "Processing config.js"
  sed -i "s|__VITE_API_URL_PLACEHOLDER__|$VITE_API_URL|g" "/app/public/config.js"
  sed -i "s|__VITE_WS_URL_PLACEHOLDER__|$VITE_WS_URL|g" "/app/public/config.js"
  sed -i "s|__VITE_DEBUG_LOGGING_PLACEHOLDER__|$VITE_DEBUG_LOGGING|g" "/app/public/config.js"
fi

echo "=== REPLACEMENT COMPLETE ==="

# Запускаем оригинальную команду CMD
exec "$@" 
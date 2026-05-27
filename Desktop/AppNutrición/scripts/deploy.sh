#!/bin/bash
set -e

cd /home/ubuntu/AppNutri/Desktop/AppNutrición

echo "=== 1. Git pull ==="
git pull origin main

echo "=== 2. Instalar dependencias ==="
npm install --prefer-offline

echo "=== 3. Prisma generate ==="
npx prisma generate

echo "=== 4. Parar PM2 (evita servir chunks rotos durante build) ==="
pm2 stop nutriapp 2>/dev/null || true

echo "=== 5. Limpiar build anterior ==="
rm -rf .next

echo "=== 6. Build ==="
npm run build

echo "=== 7. Arrancar con PM2 ==="
pm2 delete nutriapp 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "=== 8. Verificar ==="
sleep 3
STATUS=$(curl -s -m 10 -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$STATUS" = "200" ]; then
  echo "OK: /login responde 200"
else
  echo "ERROR: /login responde $STATUS"
  pm2 logs nutriapp --lines 20 --nostream
  exit 1
fi

echo "=== Deploy completado ==="

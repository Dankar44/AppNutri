#!/bin/bash
set -e

cd /home/ubuntu/AppNutri/Desktop/AppNutrición

echo "=== 1. Git pull ==="
git pull origin main

echo "=== 2. Instalar dependencias ==="
npm install --prefer-offline

echo "=== 3. Prisma generate ==="
npx prisma generate

echo "=== 4. Build (PM2 sigue sirviendo la versión anterior) ==="
npm run build

echo "=== 5. Restart PM2 (carga la nueva versión) ==="
pm2 restart nutriapp 2>/dev/null || (pm2 delete nutriapp 2>/dev/null; pm2 start ecosystem.config.cjs)
pm2 save

echo "=== 6. Verificar ==="
sleep 3
STATUS=$(curl -s -m 10 -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$STATUS" = "200" ]; then
  echo "OK: /login responde 200"
else
  echo "ERROR: /login responde $STATUS"
  pm2 logs nutriapp --lines 20 --nostream
  exit 1
fi

echo "=== Deploy completado (zero-downtime) ==="

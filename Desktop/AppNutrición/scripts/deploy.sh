#!/bin/bash
set -e

cd /home/ubuntu/AppNutri/Desktop/AppNutrición

echo "=== 1. Git pull ==="
git pull origin main

echo "=== 2. Instalar dependencias ==="
npm install --prefer-offline

echo "=== 3. Prisma generate ==="
npx prisma generate

# Compilar en una carpeta APARTE (.next-build). Mientras dura el build (~1-2 min),
# PM2 sigue sirviendo la carpeta .next ANTERIOR intacta -> nadie ve la web a medias
# (ni estilos rotos ni textos que dependen del JS sin cargar).
echo "=== 4. Build en .next-build (PM2 sigue sirviendo .next intacto) ==="
rm -rf .next-build
NEXT_DIST_DIR=.next-build npm run build

# Swap: el build nuevo pasa a ser .next y reiniciamos. El único corte es el restart
# (~1-2s), igual que antes, pero SIN la ventana de estilos rotos durante el build.
echo "=== 5. Swap + restart (~1-2s) ==="
rm -rf .next-old
mv .next .next-old
mv .next-build .next
pm2 restart nutriapp
pm2 save

echo "=== 6. Verificar ==="
sleep 3
STATUS=$(curl -s -m 10 -o /dev/null -w "%{http_code}" http://localhost:3000/login)
if [ "$STATUS" = "200" ]; then
  echo "OK: /login responde 200"
  rm -rf .next-old
  echo "=== Deploy completado (build aislado + swap, sin rotura de estilos) ==="
else
  echo "ERROR: /login responde $STATUS — ROLLBACK al build anterior"
  rm -rf .next
  mv .next-old .next
  pm2 restart nutriapp
  pm2 save
  pm2 logs nutriapp --lines 20 --nostream
  exit 1
fi

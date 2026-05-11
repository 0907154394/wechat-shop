@echo off
cd /d "d:\wechat-shop"
echo Dang build web, vui long cho...
npm run build
echo Build xong! Dang chay web...
start "" "http://localhost:3001"
npm start -- --port 3001
pause

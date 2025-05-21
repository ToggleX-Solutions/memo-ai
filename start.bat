@echo off
echo Démarrage de TFCGen...

:: Démarrer le backend
start cmd /k "cd backend && npm install && npm start"

:: Attendre 5 secondes pour laisser le backend démarrer
timeout /t 5

:: Démarrer le frontend
start cmd /k "cd frontend && npm install && npm start"

echo Application TFCGen démarrée !
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000 
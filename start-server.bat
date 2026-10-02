@echo off
title HTML Quiz Server

cd /d "%~dp0"

echo ==============================
echo       HTML QUIZ SERVER
echo ==============================
echo.
echo Starting server...
echo.

node server.js

echo.
echo Server stopped.
pause
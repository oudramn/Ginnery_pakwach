@echo off
cd /d "%~dp0"
title The Ginnery - Local Website
echo THE GINNERY - HOTEL WEBSITE
echo.
echo Starting the local website and authenticated staff portal...
echo Guest website: http://127.0.0.1:8000
echo Explore:       http://127.0.0.1:8000/explore.html
echo Staff portal:  http://127.0.0.1:8000/admin.html
echo.
echo Sign in with an existing staff account. No shared default password is configured.
echo Keep this window open while using the site. Press Ctrl+C to stop the server.
echo This launcher binds to this PC only; it is not a public deployment.
echo.
where py >nul 2>nul
if not errorlevel 1 (
  py app.py
) else (
  python app.py
)
pause

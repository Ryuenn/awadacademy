@echo off
REM Local preview of the site with Vercel's cleanUrls behaviour.
REM Double-click this file, or run `dev` from a terminal in the project root.
REM Any extra arguments are passed through, e.g.  dev --port 8080 --mock-api

setlocal
cd /d "%~dp0"

where py >nul 2>nul
if %errorlevel%==0 (
  py tools\serve.py %*
) else (
  python tools\serve.py %*
)

REM Keep the window open if it was double-clicked and the server exited/failed.
if "%~1"=="" pause
endlocal

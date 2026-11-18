@echo off
cd /d "%~dp0"
start "Room game server - close this window to stop" powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-game.ps1"

@echo off
set EDGE="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
set URL=http://localhost:3000/smoke/pdf-harness.html?autorun=pdf&sink=http://127.0.0.1:3737
%EDGE% --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=1400,1800 --virtual-time-budget=15000 --user-data-dir=%TEMP%\edge-test-3 %URL%
exit /b %ERRORLEVEL%
@echo off
REM Windows batch script to increment version in package.json and tauri.conf.json
REM Then automatically commit, tag, and push to GitHub and Gitee
REM Usage: increment-version.bat

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Define file paths
set PACKAGE_JSON=%SCRIPT_DIR%package.json
set TAURI_CONF=%SCRIPT_DIR%src-tauri\tauri.conf.json
set TEMP_FILE=%SCRIPT_DIR%temp_version.txt

REM Check if files exist
if not exist "%PACKAGE_JSON%" (
    echo Error: package.json not found at %PACKAGE_JSON%
    exit /b 1
)

if not exist "%TAURI_CONF%" (
    echo Error: tauri.conf.json not found at %TAURI_CONF%
    exit /b 1
)

REM Read current version from package.json
for /f "tokens=2 delims=: " %%A in ('findstr "version" "%PACKAGE_JSON%"') do (
    set VERSION_LINE=%%A
    goto :parse_version
)

:parse_version
REM Remove quotes and commas from version
set CURRENT_VERSION=%VERSION_LINE:"=%
set CURRENT_VERSION=%CURRENT_VERSION:,=%
set CURRENT_VERSION=%CURRENT_VERSION: =%

echo Current version: %CURRENT_VERSION%

REM Parse version parts (major.minor.patch)
for /f "tokens=1,2,3 delims=." %%A in ("%CURRENT_VERSION%") do (
    set MAJOR=%%A
    set MINOR=%%B
    set PATCH=%%C
)

REM Increment patch version
set /a NEW_PATCH=%PATCH% + 1
set NEW_VERSION=%MAJOR%.%MINOR%.%NEW_PATCH%

echo New version: %NEW_VERSION%

REM Update package.json using a temporary file
(for /f "delims=" %%L in ('type "%PACKAGE_JSON%"') do (
    set "LINE=%%L"
    if "!LINE:version=!" neq "!LINE!" (
        echo   "version": "%NEW_VERSION%",
    ) else (
        echo !LINE!
    )
)) > "%TEMP_FILE%"
move /y "%TEMP_FILE%" "%PACKAGE_JSON%" >nul

REM Update tauri.conf.json using a temporary file
(for /f "delims=" %%L in ('type "%TAURI_CONF%"') do (
    set "LINE=%%L"
    if "!LINE:version=!" neq "!LINE!" (
        echo   "version": "%NEW_VERSION%",
    ) else (
        echo !LINE!
    )
)) > "%TEMP_FILE%"
move /y "%TEMP_FILE%" "%TAURI_CONF%" >nul

echo.
echo Version updated successfully!
echo package.json: %CURRENT_VERSION% -^> %NEW_VERSION%
echo tauri.conf.json: %CURRENT_VERSION% -^> %NEW_VERSION%
echo.

REM Change to script directory for git operations
cd /d "%SCRIPT_DIR%"

REM Git operations
echo Performing git operations...
echo.

REM Stage changes
echo [1/5] Staging changes...
git add package.json src-tauri\tauri.conf.json
if errorlevel 1 (
    echo Error: Failed to stage changes
    pause
    exit /b 1
)

REM Commit changes
echo [2/5] Committing changes...
git commit -m "修改版本号%NEW_VERSION%"
if errorlevel 1 (
    echo Error: Failed to commit changes
    pause
    exit /b 1
)

REM Create tag
echo [3/5] Creating git tag...
git tag v%NEW_VERSION%
if errorlevel 1 (
    echo Error: Failed to create tag
    pause
    exit /b 1
)

REM Push to GitHub
echo [4/5] Pushing to GitHub...
git push origin master
if errorlevel 1 (
    echo Warning: Failed to push to GitHub master branch
)
git push origin v%NEW_VERSION%
if errorlevel 1 (
    echo Warning: Failed to push tag to GitHub
)

REM Push to Gitee
echo [5/5] Pushing to Gitee...
git push gitee master
if errorlevel 1 (
    echo Warning: Failed to push to Gitee master branch
)
git push gitee v%NEW_VERSION%
if errorlevel 1 (
    echo Warning: Failed to push tag to Gitee
)

echo.
echo ========================================
echo Version increment completed successfully!
echo ========================================
echo Version: %CURRENT_VERSION% -^> %NEW_VERSION%
echo Commit: 修改版本号%NEW_VERSION%
echo Tag: v%NEW_VERSION%
echo Pushed to: GitHub and Gitee
echo ========================================
echo.
pause


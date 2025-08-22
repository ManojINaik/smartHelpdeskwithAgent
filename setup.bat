@echo off
REM Smart Helpdesk One-Click Setup Script for Windows
REM This script automates the entire setup process

echo.
echo ====================================================
echo  Smart Helpdesk - One-Click Setup for Windows
echo ====================================================
echo.

REM Check if Docker is installed and running
echo [1/5] Checking Docker installation...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/
    echo After installation, restart this script.
    pause
    exit /b 1
)

echo ✓ Docker is installed

REM Check if Docker daemon is running
echo [2/5] Checking if Docker is running...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker daemon is not running
    echo Please start Docker Desktop and wait for it to fully load (whale icon in system tray)
    echo Then restart this script.
    pause
    exit /b 1
)

echo ✓ Docker is running

REM Copy environment file if it doesn't exist
echo [3/5] Setting up environment configuration...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo ✓ Environment file created from template
    ) else (
        echo ⚠ Warning: .env.example not found, using default configuration
    )
) else (
    echo ✓ Environment file already exists
)

REM Stop any existing containers
echo [4/5] Cleaning up any existing containers...
docker compose down >nul 2>&1

REM Start all services
echo [5/5] Starting Smart Helpdesk services...
echo This may take 2-5 minutes on first run (downloading images and building)
echo Please wait...
echo.

docker compose up --build -d

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start services
    echo Try running: docker compose logs
    pause
    exit /b 1
)

REM Wait for services to be ready
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo.
echo Checking service status...
docker compose ps

REM Seed the database
echo.
echo Seeding database with sample data...
docker compose run --rm seeder

echo.
echo ====================================================
echo  🎉 Setup Complete! 
echo ====================================================
echo.
echo Your Smart Helpdesk is now running!
echo.
echo 🌐 Frontend: http://localhost:5173
echo 🔧 Backend API: http://localhost:3000  
echo 📊 BullMQ Dashboard: http://localhost:3001
echo.
echo 🔑 Default Login Credentials:
echo    Admin: admin@smarthelpdesk.com / admin123
echo    Agent: john.agent@smarthelpdesk.com / agent123  
echo    User: mike.customer@example.com / user123
echo.
echo 📖 Full documentation available in README.md
echo.
echo Press any key to open the application in your browser...
pause >nul

REM Open browser
start http://localhost:5173

echo.
echo To stop the application later, run: docker compose down
echo To restart the application, run: docker compose up -d
echo.
pause
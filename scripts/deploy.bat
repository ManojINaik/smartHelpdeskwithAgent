@echo off
REM Smart Helpdesk Deployment Script for Windows
REM This script automates the deployment process for the smart helpdesk system

setlocal enabledelayedexpansion

REM Configuration
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=development
set COMPOSE_FILE=docker-compose.yml
set PROD_COMPOSE_FILE=docker-compose.prod.yml

REM Colors for output (Windows doesn't support ANSI colors in batch)
set INFO=[INFO]
set SUCCESS=[SUCCESS]
set WARNING=[WARNING]
set ERROR=[ERROR]

echo %INFO% Starting Smart Helpdesk deployment...
echo %INFO% Environment: %ENVIRONMENT%
echo.

REM Check if Docker is running
echo %INFO% Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not running. Please start Docker and try again.
    exit /b 1
)
echo %SUCCESS% Docker is running

REM Check if Docker Compose is available
echo %INFO% Checking Docker Compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker Compose is not installed. Please install Docker Compose and try again.
    exit /b 1
)
echo %SUCCESS% Docker Compose is available

REM Validate environment file
echo %INFO% Validating environment file...
if not exist ".env" (
    echo %WARNING% No .env file found. Creating from template...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo %WARNING% Please update the .env file with your configuration values before continuing.
        echo %WARNING% Press Enter when ready to continue...
        pause >nul
    ) else (
        echo %ERROR% No .env.example file found. Please create a .env file manually.
        exit /b 1
    )
)
echo %SUCCESS% Environment file validated

REM Deploy services
echo %INFO% Building and starting services...
if "%ENVIRONMENT%"=="production" (
    echo %INFO% Deploying in PRODUCTION mode
    docker-compose -f %PROD_COMPOSE_FILE% build
    if errorlevel 1 (
        echo %ERROR% Build failed
        exit /b 1
    )
    docker-compose -f %PROD_COMPOSE_FILE% up -d
    if errorlevel 1 (
        echo %ERROR% Failed to start services
        exit /b 1
    )
) else (
    echo %INFO% Deploying in DEVELOPMENT mode
    docker-compose -f %COMPOSE_FILE% build
    if errorlevel 1 (
        echo %ERROR% Build failed
        exit /b 1
    )
    docker-compose -f %COMPOSE_FILE% up -d
    if errorlevel 1 (
        echo %ERROR% Failed to start services
        exit /b 1
    )
)
echo %SUCCESS% Services started successfully

REM Wait for services to be ready
echo %INFO% Waiting for services to be ready...
set /a attempts=0
set max_attempts=30

:wait_loop
if "%ENVIRONMENT%"=="production" (
    docker-compose -f %PROD_COMPOSE_FILE% ps | findstr "Up" >nul
    if errorlevel 1 (
        set /a attempts+=1
        if !attempts! geq %max_attempts% (
            echo %ERROR% Services failed to start within the expected time
            exit /b 1
        )
        echo %INFO% Waiting for services... (attempt !attempts!/%max_attempts%)
        timeout /t 10 /nobreak >nul
        goto wait_loop
    )
) else (
    docker-compose -f %COMPOSE_FILE% ps | findstr "Up" >nul
    if errorlevel 1 (
        set /a attempts+=1
        if !attempts! geq %max_attempts% (
            echo %ERROR% Services failed to start within the expected time
            exit /b 1
        )
        echo %INFO% Waiting for services... (attempt !attempts!/%max_attempts%)
        timeout /t 10 /nobreak >nul
        goto wait_loop
    )
)
echo %SUCCESS% All services are running

REM Seed database (only in development)
if not "%ENVIRONMENT%"=="production" (
    echo %INFO% Seeding database with sample data...
    timeout /t 10 /nobreak >nul
    if "%ENVIRONMENT%"=="production" (
        docker-compose -f %PROD_COMPOSE_FILE% exec -T api node scripts/seed-database.js
    ) else (
        docker-compose -f %COMPOSE_FILE% exec -T api node scripts/seed-database.js
    )
    if errorlevel 1 (
        echo %WARNING% Database seeding failed, but continuing...
    ) else (
        echo %SUCCESS% Database seeded successfully
    )
)

REM Show final status
echo %INFO% Deployment Status:
echo.
if "%ENVIRONMENT%"=="production" (
    docker-compose -f %PROD_COMPOSE_FILE% ps
) else (
    docker-compose -f %COMPOSE_FILE% ps
)

echo.
echo %INFO% Service URLs:
echo   - Frontend: http://localhost:80 (production) or http://localhost:5173 (development)
echo   - API: http://localhost:3000
echo   - MongoDB: localhost:27017
echo   - Redis: localhost:6379
echo.
echo %INFO% Default login credentials:
echo   - Admin: admin@smarthelpdesk.com / admin123
echo   - Agent: john.agent@smarthelpdesk.com / agent123
echo   - User: mike.customer@example.com / user123

echo.
echo %SUCCESS% Deployment completed successfully!

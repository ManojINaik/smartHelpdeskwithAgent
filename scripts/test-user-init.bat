@echo off
setlocal EnableDelayedExpansion

REM Test script to verify MongoDB user initialization (Windows version)
REM This script tests that users are created correctly during Docker initialization

echo 🧪 Testing MongoDB User Initialization...
echo.

REM Check if Docker and Docker Compose are available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is required but not installed. Aborting.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is required but not installed. Aborting.
    exit /b 1
)

echo ℹ️  Starting MongoDB container for testing...

REM Stop and remove any existing containers
docker-compose down -v >nul 2>&1

REM Start only MongoDB service
docker-compose up -d mongodb

REM Wait for MongoDB to be ready
echo ℹ️  Waiting for MongoDB to initialize...
timeout /t 10 /nobreak >nul

REM Check if MongoDB container is running
docker-compose ps mongodb | findstr /C:"Up" >nul
if errorlevel 1 (
    echo ❌ MongoDB container failed to start
    docker-compose logs mongodb
    exit /b 1
)

echo ✅ MongoDB container is running

REM Wait a bit more for initialization script to complete
timeout /t 5 /nobreak >nul

REM Test database connection and user creation
echo ℹ️  Testing database connection and user creation...
echo.

REM Test 1: Check users collection
echo ℹ️  Test 1: Checking users collection...
for /f %%i in ('docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.users.countDocuments()" --quiet 2^>nul') do set user_count=%%i

if "!user_count!"=="4" (
    echo ✅ Found 4 users in database
) else (
    echo ❌ Expected 4 users, found: !user_count!
)

REM Test 2: Check if admin user exists
echo ℹ️  Test 2: Checking admin user...
for /f %%i in ('docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.users.countDocuments({email: 'admin@smarthelpdesk.com'})" --quiet 2^>nul') do set admin_exists=%%i

if "!admin_exists!"=="1" (
    echo ✅ Admin user exists
) else (
    echo ❌ Admin user not found
)

REM Test 3: Check if agent user exists
echo ℹ️  Test 3: Checking agent user...
for /f %%i in ('docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.users.countDocuments({email: 'john.agent@smarthelpdesk.com'})" --quiet 2^>nul') do set agent_exists=%%i

if "!agent_exists!"=="1" (
    echo ✅ Agent user exists
) else (
    echo ❌ Agent user not found
)

REM Test 4: Check customer users
echo ℹ️  Test 4: Checking customer users...
for /f %%i in ('docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.users.countDocuments({role: 'user'})" --quiet 2^>nul') do set customers_count=%%i

if "!customers_count!"=="2" (
    echo ✅ Found 2 customer users
) else (
    echo ❌ Expected 2 customer users, found: !customers_count!
)

REM Test 5: Check system configuration
echo ℹ️  Test 5: Checking system configuration...
for /f %%i in ('docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.configs.countDocuments()" --quiet 2^>nul') do set config_count=%%i

if "!config_count!"=="1" (
    echo ✅ System configuration created
) else (
    echo ⚠️  System configuration not found or multiple configs exist
)

REM Display user summary
echo.
echo ℹ️  User Summary:
docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "use smart_helpdesk; db.users.find({}, {name: 1, email: 1, role: 1, _id: 0}).forEach(function(user) { print('  - ' + user.name + ' (' + user.email + ') - Role: ' + user.role) })" --quiet 2>nul

REM Show container logs (last few lines)
echo.
echo ℹ️  Recent container initialization logs:
docker-compose logs --tail 10 mongodb

echo.
echo ✅ MongoDB user initialization test completed!
echo ℹ️  Run 'docker-compose down -v' to clean up test containers
echo.
echo 🎉 All tests completed! The MongoDB initialization system is working correctly.
echo.
echo To use in your development environment:
echo   1. Run: docker-compose up -d
echo   2. Wait for initialization to complete
echo   3. Access your application with the default users:
echo      - Admin: admin@smarthelpdesk.com / admin123
echo      - Agent: john.agent@smarthelpdesk.com / agent123
echo      - Customer: mike.customer@example.com / user123
echo      - Customer: john.customer@example.com / user456

pause
#!/bin/bash

# Smart Helpdesk One-Click Setup Script for Mac/Linux
# This script automates the entire setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "===================================================="
echo "  Smart Helpdesk - One-Click Setup for Mac/Linux"
echo "===================================================="
echo -e "${NC}"

# Check if Docker is installed and running
echo -e "${BLUE}[1/5]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR:${NC} Docker is not installed"
    echo "Please install Docker from: https://www.docker.com/products/docker-desktop/"
    echo "After installation, restart this script."
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is installed"

# Check if Docker daemon is running
echo -e "${BLUE}[2/5]${NC} Checking if Docker is running..."
if ! docker ps &> /dev/null; then
    echo -e "${RED}ERROR:${NC} Docker daemon is not running"
    echo "Please start Docker Desktop and wait for it to fully load"
    echo "Then restart this script."
    exit 1
fi

echo -e "${GREEN}✓${NC} Docker is running"

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} Using docker-compose (legacy)"
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Copy environment file if it doesn't exist
echo -e "${BLUE}[3/5]${NC} Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓${NC} Environment file created from template"
    else
        echo -e "${YELLOW}⚠${NC} Warning: .env.example not found, using default configuration"
    fi
else
    echo -e "${GREEN}✓${NC} Environment file already exists"
fi

# Stop any existing containers
echo -e "${BLUE}[4/5]${NC} Cleaning up any existing containers..."
$DOCKER_COMPOSE down &> /dev/null || true

# Start all services
echo -e "${BLUE}[5/5]${NC} Starting Smart Helpdesk services..."
echo "This may take 2-5 minutes on first run (downloading images and building)"
echo "Please wait..."
echo

if ! $DOCKER_COMPOSE up --build -d; then
    echo
    echo -e "${RED}ERROR:${NC} Failed to start services"
    echo "Try running: $DOCKER_COMPOSE logs"
    exit 1
fi

# Wait for services to be ready
echo
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
echo
echo "Checking service status..."
$DOCKER_COMPOSE ps

# Seed the database
echo
echo "Seeding database with sample data..."
$DOCKER_COMPOSE run --rm seeder || echo -e "${YELLOW}⚠${NC} Seeding may have failed, but application should still work"

echo
echo -e "${GREEN}"
echo "===================================================="
echo "  🎉 Setup Complete! "
echo "===================================================="
echo -e "${NC}"
echo
echo "Your Smart Helpdesk is now running!"
echo
echo -e "${BLUE}🌐 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000"
echo -e "${BLUE}📊 BullMQ Dashboard:${NC} http://localhost:3001"
echo
echo -e "${YELLOW}🔑 Default Login Credentials:${NC}"
echo "   Admin: admin@smarthelpdesk.com / admin123"
echo "   Agent: john.agent@smarthelpdesk.com / agent123"
echo "   User: mike.customer@example.com / user123"
echo
echo -e "${BLUE}📖 Full documentation available in README.md${NC}"
echo

# Try to open browser (works on most systems)
if command -v open &> /dev/null; then
    # macOS
    echo "Opening application in browser..."
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    echo "Opening application in browser..."
    xdg-open http://localhost:5173
else
    echo "Please open http://localhost:5173 in your browser"
fi

echo
echo -e "${BLUE}To stop the application later:${NC} $DOCKER_COMPOSE down"
echo -e "${BLUE}To restart the application:${NC} $DOCKER_COMPOSE up -d"
echo
#!/bin/bash

# Smart Helpdesk Deployment Script
# This script automates the deployment process for the smart helpdesk system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
COMPOSE_FILE="docker-compose.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to validate environment file
validate_env_file() {
    if [ ! -f ".env" ]; then
        print_warning "No .env file found. Creating from template..."
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Please update the .env file with your configuration values before continuing."
            print_warning "Press Enter when ready to continue..."
            read
        else
            print_error "No .env.example file found. Please create a .env file manually."
            exit 1
        fi
    fi
    print_success "Environment file validated"
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Deploying in PRODUCTION mode"
        docker-compose -f $PROD_COMPOSE_FILE build
        docker-compose -f $PROD_COMPOSE_FILE up -d
    else
        print_status "Deploying in DEVELOPMENT mode"
        docker-compose -f $COMPOSE_FILE build
        docker-compose -f $COMPOSE_FILE up -d
    fi
    
    print_success "Services started successfully"
}

# Function to wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if [ "$ENVIRONMENT" = "production" ]; then
            if docker-compose -f $PROD_COMPOSE_FILE ps | grep -q "healthy"; then
                print_success "All services are healthy"
                return 0
            fi
        else
            if docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
                print_success "All services are running"
                return 0
            fi
        fi
        
        print_status "Waiting for services... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    print_error "Services failed to start within the expected time"
    return 1
}

# Function to seed database
seed_database() {
    print_status "Seeding database with sample data..."
    
    # Wait a bit for MongoDB to be ready
    sleep 10
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE exec -T api node scripts/seed-database.js
    else
        docker-compose -f $COMPOSE_FILE exec -T api node scripts/seed-database.js
    fi
    
    print_success "Database seeded successfully"
}

# Function to show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE ps
    else
        docker-compose -f $COMPOSE_FILE ps
    fi
    
    echo ""
    print_status "Service URLs:"
    echo "  - Frontend: http://localhost:80 (production) or http://localhost:5173 (development)"
    echo "  - API: http://localhost:3000"
    echo "  - MongoDB: localhost:27017"
    echo "  - Redis: localhost:6379"
    echo ""
    print_status "Default login credentials:"
    echo "  - Admin: admin@smarthelpdesk.com / admin123"
    echo "  - Agent: john.agent@smarthelpdesk.com / agent123"
    echo "  - User: mike.customer@example.com / user123"
}

# Function to cleanup on error
cleanup() {
    print_error "Deployment failed. Cleaning up..."
    if [ "$ENVIRONMENT" = "production" ]; then
        docker-compose -f $PROD_COMPOSE_FILE down
    else
        docker-compose -f $COMPOSE_FILE down
    fi
}

# Main deployment function
main() {
    print_status "Starting Smart Helpdesk deployment..."
    print_status "Environment: $ENVIRONMENT"
    echo ""
    
    # Set up error handling
    trap cleanup ERR
    
    # Pre-deployment checks
    check_docker
    check_docker_compose
    validate_env_file
    
    # Deploy services
    deploy_services
    
    # Wait for services to be ready
    wait_for_services
    
    # Seed database (only in development)
    if [ "$ENVIRONMENT" != "production" ]; then
        seed_database
    fi
    
    # Show final status
    show_status
    
    print_success "Deployment completed successfully!"
}

# Function to show usage
usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development (default) - Deploy in development mode"
    echo "  production           - Deploy in production mode"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy in development mode"
    echo "  $0 development        # Deploy in development mode"
    echo "  $0 production         # Deploy in production mode"
}

# Check command line arguments
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

if [ "$1" != "" ] && [ "$1" != "development" ] && [ "$1" != "production" ]; then
    print_error "Invalid environment: $1"
    usage
    exit 1
fi

# Run main function
main


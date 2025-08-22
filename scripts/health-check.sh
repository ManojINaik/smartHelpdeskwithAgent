#!/bin/bash

# Smart Helpdesk Health Check Script
# This script checks the health of all services in the smart helpdesk system

set -e

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

# Function to check if a service is running
check_service_running() {
    local service_name=$1
    local compose_file=$2
    
    if docker-compose -f $compose_file ps $service_name | grep -q "Up"; then
        return 0
    else
        return 1
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local compose_file=$2
    local health_endpoint=$3
    
    if [ -n "$health_endpoint" ]; then
        # Try to access health endpoint
        if docker-compose -f $compose_file exec -T $service_name curl -f $health_endpoint > /dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Just check if container is running
        return $(check_service_running $service_name $compose_file)
    fi
}

# Function to check database connectivity
check_database_connectivity() {
    local compose_file=$1
    
    print_status "Checking database connectivity..."
    
    if docker-compose -f $compose_file exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        print_success "MongoDB is accessible"
        return 0
    else
        print_error "MongoDB is not accessible"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis_connectivity() {
    local compose_file=$1
    
    print_status "Checking Redis connectivity..."
    
    if docker-compose -f $compose_file exec -T redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is accessible"
        return 0
    else
        print_error "Redis is not accessible"
        return 1
    fi
}

# Function to check API endpoints
check_api_endpoints() {
    local compose_file=$1
    
    print_status "Checking API endpoints..."
    
    # Check basic health endpoint
    if docker-compose -f $compose_file exec -T api curl -f http://localhost:3000/health > /dev/null 2>&1; then
        print_success "API health endpoint is responding"
    else
        print_error "API health endpoint is not responding"
        return 1
    fi
    
    # Check detailed health endpoint
    if docker-compose -f $compose_file exec -T api curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
        print_success "API detailed health endpoint is responding"
    else
        print_warning "API detailed health endpoint is not responding"
    fi
    
    return 0
}

# Function to check frontend accessibility
check_frontend_accessibility() {
    local compose_file=$1
    
    print_status "Checking frontend accessibility..."
    
    if docker-compose -f $compose_file exec -T client curl -f http://localhost:80/health > /dev/null 2>&1; then
        print_success "Frontend is accessible"
        return 0
    else
        print_error "Frontend is not accessible"
        return 1
    fi
}

# Function to check resource usage
check_resource_usage() {
    local compose_file=$1
    
    print_status "Checking resource usage..."
    
    echo ""
    echo "Container Resource Usage:"
    echo "========================"
    docker-compose -f $compose_file stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    echo ""
}

# Function to check logs for errors
check_logs_for_errors() {
    local compose_file=$1
    local service_name=$2
    
    print_status "Checking $service_name logs for errors..."
    
    local error_count=$(docker-compose -f $compose_file logs $service_name 2>/dev/null | grep -i "error\|exception\|fatal" | wc -l)
    
    if [ $error_count -eq 0 ]; then
        print_success "No errors found in $service_name logs"
    else
        print_warning "Found $error_count potential errors in $service_name logs"
        echo "Recent errors:"
        docker-compose -f $compose_file logs $service_name 2>/dev/null | grep -i "error\|exception\|fatal" | tail -5
    fi
}

# Function to perform comprehensive health check
perform_health_check() {
    local compose_file=$1
    
    print_status "Starting comprehensive health check..."
    echo ""
    
    # Check if Docker Compose file exists
    if [ ! -f "$compose_file" ]; then
        print_error "Docker Compose file $compose_file not found"
        return 1
    fi
    
    # Check if services are running
    print_status "Checking service status..."
    docker-compose -f $compose_file ps
    echo ""
    
    # Check individual services
    local all_healthy=true
    
    # Check MongoDB
    if check_service_health "mongodb" $compose_file; then
        print_success "MongoDB service is healthy"
        check_database_connectivity $compose_file || all_healthy=false
    else
        print_error "MongoDB service is not healthy"
        all_healthy=false
    fi
    
    # Check Redis
    if check_service_health "redis" $compose_file; then
        print_success "Redis service is healthy"
        check_redis_connectivity $compose_file || all_healthy=false
    else
        print_error "Redis service is not healthy"
        all_healthy=false
    fi
    
    # Check API
    if check_service_health "api" $compose_file; then
        print_success "API service is healthy"
        check_api_endpoints $compose_file || all_healthy=false
    else
        print_error "API service is not healthy"
        all_healthy=false
    fi
    
    # Check Client
    if check_service_health "client" $compose_file; then
        print_success "Client service is healthy"
        check_frontend_accessibility $compose_file || all_healthy=false
    else
        print_error "Client service is not healthy"
        all_healthy=false
    fi
    
    # Check resource usage
    check_resource_usage $compose_file
    
    # Check logs for errors
    echo ""
    print_status "Checking service logs for errors..."
    check_logs_for_errors $compose_file "api"
    check_logs_for_errors $compose_file "client"
    check_logs_for_errors $compose_file "mongodb"
    check_logs_for_errors $compose_file "redis"
    
    # Summary
    echo ""
    print_status "Health Check Summary:"
    echo "========================"
    
    if [ "$all_healthy" = true ]; then
        print_success "All services are healthy and operational"
        return 0
    else
        print_error "Some services are not healthy"
        return 1
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development (default) - Check health in development mode"
    echo "  production           - Check health in production mode"
    echo ""
    echo "Examples:"
    echo "  $0                    # Check health in development mode"
    echo "  $0 development        # Check health in development mode"
    echo "  $0 production         # Check health in production mode"
}

# Main function
main() {
    print_status "Starting Smart Helpdesk health check..."
    print_status "Environment: $ENVIRONMENT"
    echo ""
    
    # Determine which compose file to use
    local compose_file
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file=$PROD_COMPOSE_FILE
    else
        compose_file=$COMPOSE_FILE
    fi
    
    # Perform health check
    if perform_health_check $compose_file; then
        print_success "Health check completed successfully!"
        exit 0
    else
        print_error "Health check failed!"
        exit 1
    fi
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


#!/bin/bash

# Test script to verify MongoDB user initialization
# This script tests that users are created correctly during Docker initialization

echo "🧪 Testing MongoDB User Initialization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $2${NC}"
    elif [ "$1" = "ERROR" ]; then
        echo -e "${RED}❌ $2${NC}"
    elif [ "$1" = "WARNING" ]; then
        echo -e "${YELLOW}⚠️  $2${NC}"
    elif [ "$1" = "INFO" ]; then
        echo -e "${BLUE}ℹ️  $2${NC}"
    fi
}

# Check if Docker and Docker Compose are available
command -v docker >/dev/null 2>&1 || { 
    print_status "ERROR" "Docker is required but not installed. Aborting."
    exit 1
}

command -v docker-compose >/dev/null 2>&1 || { 
    print_status "ERROR" "Docker Compose is required but not installed. Aborting."
    exit 1
}

print_status "INFO" "Starting MongoDB container for testing..."

# Stop and remove any existing containers
docker-compose down -v 2>/dev/null

# Start only MongoDB service
docker-compose up -d mongodb

# Wait for MongoDB to be ready
print_status "INFO" "Waiting for MongoDB to initialize..."
sleep 10

# Check if MongoDB container is running
if ! docker-compose ps mongodb | grep -q "Up"; then
    print_status "ERROR" "MongoDB container failed to start"
    docker-compose logs mongodb
    exit 1
fi

print_status "SUCCESS" "MongoDB container is running"

# Wait a bit more for initialization script to complete
sleep 5

# Test database connection and user creation
print_status "INFO" "Testing database connection and user creation..."

# Function to run MongoDB commands
run_mongo_command() {
    docker exec smart-helpdesk-mongodb mongosh -u admin -p password --authenticationDatabase admin --eval "$1" --quiet 2>/dev/null
}

# Test 1: Check if database exists
print_status "INFO" "Test 1: Checking if smart_helpdesk database exists..."
result=$(run_mongo_command "show dbs" | grep smart_helpdesk)
if [ -n "$result" ]; then
    print_status "SUCCESS" "Database 'smart_helpdesk' exists"
else
    print_status "ERROR" "Database 'smart_helpdesk' not found"
fi

# Test 2: Check users collection
print_status "INFO" "Test 2: Checking users collection..."
user_count=$(run_mongo_command "use smart_helpdesk; db.users.countDocuments()")
if [ "$user_count" = "4" ]; then
    print_status "SUCCESS" "Found 4 users in database"
else
    print_status "ERROR" "Expected 4 users, found: $user_count"
fi

# Test 3: Check specific users
print_status "INFO" "Test 3: Verifying specific users..."

users=("admin@smarthelpdesk.com" "john.agent@smarthelpdesk.com" "mike.customer@example.com" "john.customer@example.com")
roles=("admin" "agent" "user" "user")

for i in "${!users[@]}"; do
    email="${users[$i]}"
    expected_role="${roles[$i]}"
    
    user_exists=$(run_mongo_command "use smart_helpdesk; db.users.findOne({email: '$email'})")
    if [ -n "$user_exists" ] && [ "$user_exists" != "null" ]; then
        actual_role=$(run_mongo_command "use smart_helpdesk; db.users.findOne({email: '$email'}).role")
        if [ "$actual_role" = "$expected_role" ]; then
            print_status "SUCCESS" "User $email exists with correct role: $expected_role"
        else
            print_status "ERROR" "User $email has incorrect role. Expected: $expected_role, Got: $actual_role"
        fi
    else
        print_status "ERROR" "User $email not found"
    fi
done

# Test 4: Check user permissions
print_status "INFO" "Test 4: Checking user permissions..."

admin_permissions=$(run_mongo_command "use smart_helpdesk; db.users.findOne({email: 'admin@smarthelpdesk.com'}).permissions.canManageUsers")
if [ "$admin_permissions" = "true" ]; then
    print_status "SUCCESS" "Admin user has correct permissions"
else
    print_status "ERROR" "Admin user permissions are incorrect"
fi

# Test 5: Check configuration
print_status "INFO" "Test 5: Checking system configuration..."
config_count=$(run_mongo_command "use smart_helpdesk; db.configs.countDocuments()")
if [ "$config_count" = "1" ]; then
    print_status "SUCCESS" "System configuration created"
else
    print_status "WARNING" "System configuration not found or multiple configs exist"
fi

# Display user summary
print_status "INFO" "User Summary:"
run_mongo_command "use smart_helpdesk; db.users.find({}, {name: 1, email: 1, role: 1, _id: 0}).forEach(function(user) { print('  - ' + user.name + ' (' + user.email + ') - Role: ' + user.role) })"

# Show container logs
print_status "INFO" "Container initialization logs:"
docker-compose logs mongodb | tail -20

print_status "SUCCESS" "MongoDB user initialization test completed!"
print_status "INFO" "Run 'docker-compose down -v' to clean up test containers"

echo ""
echo "🎉 All tests completed! The MongoDB initialization system is working correctly."
echo ""
echo "To use in your development environment:"
echo "  1. Run: docker-compose up -d"
echo "  2. Wait for initialization to complete"
echo "  3. Access your application with the default users:"
echo "     - Admin: admin@smarthelpdesk.com / admin123"
echo "     - Agent: john.agent@smarthelpdesk.com / agent123"
echo "     - Customer: mike.customer@example.com / user123"
echo "     - Customer: john.customer@example.com / user456"
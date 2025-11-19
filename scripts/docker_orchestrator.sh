#!/bin/bash
# docker_orchestrator.sh - Docker Orchestration Script for LendSmart
# This script provides utilities for managing Docker containers, images, and services
# for local development and testing environments

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory (assuming script is run from project root)
PROJECT_ROOT=$(pwd)
DOCKER_DIR="$PROJECT_ROOT/infrastructure/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
ENV_FILE="$PROJECT_ROOT/.env"

# Function to display help
show_help() {
    echo -e "${BLUE}LendSmart Docker Orchestrator${NC}"
    echo ""
    echo "Usage: ./docker_orchestrator.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                  Setup Docker environment and build images"
    echo "  start                  Start all services"
    echo "  stop                   Stop all services"
    echo "  restart                Restart all services"
    echo "  status                 Show status of all services"
    echo "  logs [SERVICE]         Show logs for a specific service or all services"
    echo "  build [SERVICE]        Build or rebuild a specific service or all services"
    echo "  exec [SERVICE] [CMD]   Execute a command in a running container"
    echo "  clean                  Remove all containers, networks, and volumes"
    echo "  prune                  Remove unused Docker resources"
    echo ""
    echo "Examples:"
    echo "  ./docker_orchestrator.sh setup"
    echo "  ./docker_orchestrator.sh start"
    echo "  ./docker_orchestrator.sh logs backend"
    echo "  ./docker_orchestrator.sh exec backend bash"
    echo "  ./docker_orchestrator.sh clean"
    echo ""
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        echo "Please install Docker first: https://docs.docker.com/get-docker/"
        return 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
        return 1
    fi

    return 0
}

# Function to setup Docker environment
setup_docker() {
    echo -e "${BLUE}Setting up Docker environment for LendSmart...${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${YELLOW}Docker Compose file not found, creating one...${NC}"

        # Create Docker directory if it doesn't exist
        mkdir -p "$DOCKER_DIR"

        # Create docker-compose.yml
        cat > "$COMPOSE_FILE" << 'EOF'
version: '3.8'

services:
  # Backend service
  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    volumes:
      - ../../backend:/app
    environment:
      - NODE_ENV=development
    depends_on:
      - database
      - redis
    networks:
      - lendsmart-network

  # Web Frontend service
  web-frontend:
    build:
      context: ../../web-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ../../web-frontend:/app
    environment:
      - NODE_ENV=development
      - REACT_APP_API_URL=http://localhost:5000
    depends_on:
      - backend
    networks:
      - lendsmart-network

  # Database service
  database:
    image: postgres:14
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=lendsmart
      - POSTGRES_PASSWORD=lendsmart
      - POSTGRES_DB=lendsmart
    networks:
      - lendsmart-network

  # Redis service
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - lendsmart-network

  # Blockchain node (Ganache)
  blockchain:
    image: trufflesuite/ganache-cli:latest
    ports:
      - "8545:8545"
    command: --deterministic --mnemonic "test test test test test test test test test test test junk" --networkId 1337 --chainId 1337
    networks:
      - lendsmart-network

  # ML Model service
  ml-service:
    build:
      context: ../../ml-model
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ../../ml-model:/app
    depends_on:
      - database
    networks:
      - lendsmart-network

networks:
  lendsmart-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
EOF

        echo -e "${GREEN}Docker Compose file created at $COMPOSE_FILE${NC}"
    fi

    # Check if Dockerfiles exist for each service, create if not
    create_dockerfile "backend" "Node.js"
    create_dockerfile "web-frontend" "React"
    create_dockerfile "ml-model" "Python"

    # Build all images
    echo -e "${YELLOW}Building Docker images...${NC}"
    docker-compose -f "$COMPOSE_FILE" build

    echo -e "${GREEN}Docker environment setup complete!${NC}"
    echo -e "You can now start the services with: ./docker_orchestrator.sh start"

    return 0
}

# Function to create Dockerfile if it doesn't exist
create_dockerfile() {
    local service=$1
    local type=$2
    local dockerfile_dir="$PROJECT_ROOT/$service"
    local dockerfile="$dockerfile_dir/Dockerfile"

    if [ ! -d "$dockerfile_dir" ]; then
        echo -e "${YELLOW}Directory for $service not found, skipping Dockerfile creation${NC}"
        return 0
    fi

    if [ ! -f "$dockerfile" ]; then
        echo -e "${YELLOW}Dockerfile for $service not found, creating one...${NC}"

        case "$type" in
            "Node.js")
                cat > "$dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
EOF
                ;;
            "React")
                cat > "$dockerfile" << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF
                ;;
            "Python")
                cat > "$dockerfile" << 'EOF'
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]
EOF
                ;;
        esac

        echo -e "${GREEN}Dockerfile created for $service${NC}"
    fi

    return 0
}

# Function to start all services
start_services() {
    echo -e "${BLUE}Starting LendSmart services...${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        echo "Please run setup first: ./docker_orchestrator.sh setup"
        return 1
    fi

    # Start services
    docker-compose -f "$COMPOSE_FILE" up -d

    # Check if services started successfully
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}LendSmart services started successfully!${NC}"
        echo -e "You can access the services at:"
        echo -e "  - Backend API: http://localhost:5000"
        echo -e "  - Web Frontend: http://localhost:3000"
        echo -e "  - ML Service: http://localhost:8000"
        echo -e "  - Database: localhost:5432"
        echo -e "  - Blockchain: http://localhost:8545"
    else
        echo -e "${RED}Failed to start LendSmart services!${NC}"
        return 1
    fi

    return 0
}

# Function to stop all services
stop_services() {
    echo -e "${BLUE}Stopping LendSmart services...${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Stop services
    docker-compose -f "$COMPOSE_FILE" down

    # Check if services stopped successfully
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}LendSmart services stopped successfully!${NC}"
    else
        echo -e "${RED}Failed to stop LendSmart services!${NC}"
        return 1
    fi

    return 0
}

# Function to restart all services
restart_services() {
    echo -e "${BLUE}Restarting LendSmart services...${NC}"

    # Stop services
    stop_services

    # Start services
    start_services

    return 0
}

# Function to show status of all services
show_status() {
    echo -e "${BLUE}LendSmart services status:${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Show status
    docker-compose -f "$COMPOSE_FILE" ps

    return 0
}

# Function to show logs for a specific service or all services
show_logs() {
    local service=$1

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Show logs
    if [ -z "$service" ]; then
        echo -e "${BLUE}Showing logs for all services...${NC}"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f
    else
        echo -e "${BLUE}Showing logs for $service...${NC}"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f "$service"
    fi

    return 0
}

# Function to build or rebuild a specific service or all services
build_service() {
    local service=$1

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Build service
    if [ -z "$service" ]; then
        echo -e "${BLUE}Building all services...${NC}"
        docker-compose -f "$COMPOSE_FILE" build
    else
        echo -e "${BLUE}Building $service...${NC}"
        docker-compose -f "$COMPOSE_FILE" build "$service"
    fi

    # Check if build was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Build successful!${NC}"
    else
        echo -e "${RED}Build failed!${NC}"
        return 1
    fi

    return 0
}

# Function to execute a command in a running container
exec_command() {
    local service=$1
    shift
    local command=$@

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Check if service is specified
    if [ -z "$service" ]; then
        echo -e "${RED}Error: No service specified${NC}"
        echo "Usage: ./docker_orchestrator.sh exec [SERVICE] [COMMAND]"
        return 1
    fi

    # Check if command is specified
    if [ -z "$command" ]; then
        echo -e "${YELLOW}No command specified, using default shell${NC}"
        command="sh"
    fi

    # Execute command
    echo -e "${BLUE}Executing command in $service container: $command${NC}"
    docker-compose -f "$COMPOSE_FILE" exec "$service" $command

    return 0
}

# Function to clean Docker resources
clean_resources() {
    echo -e "${BLUE}Cleaning Docker resources...${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Check if docker-compose.yml exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: Docker Compose file not found: $COMPOSE_FILE${NC}"
        return 1
    fi

    # Stop and remove containers, networks, and volumes
    echo -e "${YELLOW}Stopping and removing containers, networks, and volumes...${NC}"
    docker-compose -f "$COMPOSE_FILE" down -v

    echo -e "${GREEN}Docker resources cleaned!${NC}"

    return 0
}

# Function to prune unused Docker resources
prune_resources() {
    echo -e "${BLUE}Pruning unused Docker resources...${NC}"

    # Check if Docker is installed
    check_docker || return 1

    # Prune containers
    echo -e "${YELLOW}Pruning containers...${NC}"
    docker container prune -f

    # Prune images
    echo -e "${YELLOW}Pruning images...${NC}"
    docker image prune -f

    # Prune networks
    echo -e "${YELLOW}Pruning networks...${NC}"
    docker network prune -f

    # Prune volumes
    echo -e "${YELLOW}Pruning volumes...${NC}"
    docker volume prune -f

    echo -e "${GREEN}Unused Docker resources pruned!${NC}"

    return 0
}

# Main function
main() {
    # Parse command
    local command=$1
    shift

    case "$command" in
        setup)
            setup_docker
            ;;
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            local service=$1
            show_logs "$service"
            ;;
        build)
            local service=$1
            build_service "$service"
            ;;
        exec)
            local service=$1
            shift
            exec_command "$service" "$@"
            ;;
        clean)
            clean_resources
            ;;
        prune)
            prune_resources
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Error: Unknown command '$command'${NC}"
            show_help
            return 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

#!/bin/bash

# Optimized Run script for LendSmart project
# This script starts both the backend and web-frontend components

# Exit immediately if a command exits with a non-zero status, treat unset variables as an error, and fail if any command in a pipeline fails
set -euo pipefail

# --- Configuration ---
# Use 'pwd' as a fallback if git is not available, but assume it's run from the project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
VENV_PATH="$PROJECT_ROOT/venv"
BACKEND_DIR="$PROJECT_ROOT/code/backend"
FRONTEND_DIR="$PROJECT_ROOT/web-frontend"
BACKEND_PORT=5000 # Assuming default Flask port
FRONTEND_PORT=3000 # Assuming default React port

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting LendSmart application...${NC}"

# --- Helper Functions ---

# Handle graceful shutdown
cleanup() {
  echo -e "\n${BLUE}Stopping services...${NC}"
  
  # Check if PIDs are set and kill them
  if [ -n "${FRONTEND_PID:-}" ]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    echo -e "${GREEN}Frontend (PID: $FRONTEND_PID) stopped.${NC}"
  fi
  
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
    echo -e "${GREEN}Backend (PID: $BACKEND_PID) stopped.${NC}"
  fi
  
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM for graceful shutdown
trap cleanup SIGINT SIGTERM

# --- Pre-flight Checks ---

if [ ! -d "$VENV_PATH" ]; then
    echo -e "${RED}Error: Python virtual environment not found at $VENV_PATH.${NC}"
    echo -e "${RED}Please run the setup script first: $PROJECT_ROOT/scripts/setup_lendsmart_env.sh${NC}"
    exit 1
fi

# --- Start Backend Server ---
echo -e "${BLUE}Starting backend server...${NC}"

# Activate venv and run the backend
# Using nohup and & to run in background, redirecting output to a log file
# The original script used `python app.py &` which is fine, but less robust.
# We will stick to the original's simplicity but ensure the venv is sourced.
(
    cd "$BACKEND_DIR"
    source "$VENV_PATH/bin/activate"
    # Ensure dependencies are installed (silent check)
    pip install -r requirements.txt > /dev/null 2>&1 || echo -e "${RED}Warning: Failed to install backend dependencies.${NC}"
    
    echo -e "${BLUE}Running backend from $BACKEND_DIR...${NC}"
    python app.py &
    BACKEND_PID=$!
    echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
) &

# Wait for backend to initialize (optional, but good practice)
echo -e "${BLUE}Waiting for backend to initialize...${NC}"
sleep 5

# --- Start Web Frontend ---
echo -e "${BLUE}Starting web frontend...${NC}"

(
    cd "$FRONTEND_DIR"
    # Ensure dependencies are installed (silent check)
    npm install > /dev/null 2>&1 || echo -e "${RED}Warning: Failed to install frontend dependencies.${NC}"
    
    echo -e "${BLUE}Running frontend from $FRONTEND_DIR...${NC}"
    # Use npm start which typically runs react-scripts start
    npm start &
    FRONTEND_PID=$!
    echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
) &

# --- Final Output ---

echo -e "${GREEN}LendSmart application is running!${NC}"
echo -e "${GREEN}Backend running on port: $BACKEND_PORT${NC}"
echo -e "${GREEN}Frontend running on port: $FRONTEND_PORT${NC}"
echo -e "${GREEN}Access the application at: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Wait for all background processes to finish (or until SIGINT/SIGTERM is received)
wait

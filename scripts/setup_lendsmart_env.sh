#!/bin/bash

# Optimized LendSmart Environment Setup Script
# This script automates the setup of the development environment for the LendSmart project.

# Exit immediately if a command exits with a non-zero status, treat unset variables as an error, and fail if any command in a pipeline fails
set -euo pipefail

echo "Starting LendSmart Environment Setup..."

# --- Configuration ---
# Use 'pwd' as a fallback if git is not available, but assume it's run from the project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
VENV_PATH="$PROJECT_ROOT/venv"
BACKEND_DIR="$PROJECT_ROOT/code/backend"
CODE_BLOCKCHAIN_DIR="$PROJECT_ROOT/code/blockchain"
WEB_FRONTEND_DIR="$PROJECT_ROOT/web-frontend"
MOBILE_FRONTEND_DIR="$PROJECT_ROOT/mobile-frontend"

# Check if we are in the project root
if [ ! -d "$PROJECT_ROOT/code" ]; then
    echo "Error: Must be run from the LendSmart project root directory."
    exit 1
fi

# --- Helper function to check if a command exists ---
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# --- Install System-Level Dependencies ---
echo "-----------------------------------------------------------------------------"
echo "Installing System-Level Dependencies (Requires sudo access)..."
echo "-----------------------------------------------------------------------------"

# Update package lists
sudo apt-get update -y

# Install Python 3 and venv
if ! command_exists python3; then
    echo "Installing Python 3..."
    sudo apt-get install -y python3
else
    echo "Python 3 is already installed."
fi

if ! command_exists pip3; then
    echo "Installing pip3..."
    sudo apt-get install -y python3-pip
else
    echo "pip3 is already installed."
fi

if ! dpkg -s python3-venv >/dev/null 2>&1; then
    echo "Installing python3-venv..."
    sudo apt-get install -y python3-venv
else
    echo "python3-venv is already installed."
fi

# Install Node.js and npm (Using a more robust method for modern Node.js)
if ! command_exists node || ! command_exists npm; then
    echo "Installing Node.js (20.x) and npm..."
    # Use NodeSource setup script for a specific, modern version
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js and npm are already installed."
    node_version=$(node -v)
    echo "Node.js version: $node_version"
    # Basic version check (e.g., check if it starts with v20 or higher)
    if [[ "$node_version" < "v18" ]]; then
        echo "Warning: Installed Node.js version is less than v18. Some dependencies may fail."
    fi
fi

# Install Yarn (globally via npm)
if ! command_exists yarn; then
    echo "Installing Yarn globally..."
    # Use npm path to ensure correct execution if npm is installed but not in PATH yet
    NPM_PATH=$(command -v npm || echo "/usr/bin/npm")
    sudo "$NPM_PATH" install --global yarn
else
    echo "Yarn is already installed."
fi

# Install Truffle CLI (globally via npm)
if ! command_exists truffle; then
    echo "Installing Truffle CLI globally..."
    NPM_PATH=$(command -v npm || echo "/usr/bin/npm")
    sudo "$NPM_PATH" install --global truffle
else
    echo "Truffle CLI is already installed."
fi

# Install React Native CLI (globally via npm)
if ! command_exists react-native; then
    echo "Installing React Native CLI globally..."
    NPM_PATH=$(command -v npm || echo "/usr/bin/npm")
    sudo "$NPM_PATH" install --global react-native-cli
else
    echo "React Native CLI is already installed."
fi

echo "System-level dependencies installation check complete."

# --- Project Component Setup ---
echo "-----------------------------------------------------------------------------"
echo "Setting up Project Components..."
echo "-----------------------------------------------------------------------------"

# 1. Backend Setup (Python/Flask)
if [ -d "$BACKEND_DIR" ]; then
    echo "Setting up Backend (Python/Flask) in $BACKEND_DIR ..."
    
    # Create a virtual environment in the project root
    if [ ! -d "$VENV_PATH" ]; then
        echo "Creating Python virtual environment in project root ($VENV_PATH)..."
        python3 -m venv "$VENV_PATH"
    fi
    
    echo "Activating virtual environment and installing backend dependencies..."
    source "$VENV_PATH/bin/activate"
    pip install --upgrade pip
    pip install -r "$BACKEND_DIR/requirements.txt"
    deactivate
    echo "Backend setup complete."
else
    echo "Warning: Backend directory '$BACKEND_DIR' not found. Skipping backend setup."
fi

# 2. Blockchain Setup (Solidity/Truffle)
if [ -d "$CODE_BLOCKCHAIN_DIR" ]; then
    echo "Info: Blockchain (Truffle) component found in $CODE_BLOCKCHAIN_DIR."
    echo "Truffle CLI has been installed globally. You can now run 'truffle compile' or 'truffle migrate' within this directory."
else
    echo "Warning: Blockchain directory '$CODE_BLOCKCHAIN_DIR' not found. Skipping blockchain setup."
fi

# 3. Web Frontend Setup (React/react-scripts)
if [ -d "$WEB_FRONTEND_DIR" ]; then
    echo "Setting up Web Frontend (React/react-scripts) in $WEB_FRONTEND_DIR ..."
    (
        cd "$WEB_FRONTEND_DIR"
        echo "Installing web-frontend dependencies..."
        npm install
    )
    echo "Web Frontend setup complete."
else
    echo "Warning: Web Frontend directory '$WEB_FRONTEND_DIR' not found. Skipping web-frontend setup."
fi

# 4. Mobile Frontend Setup (React Native)
if [ -d "$MOBILE_FRONTEND_DIR" ]; then
    echo "Setting up Mobile Frontend (React Native) in $MOBILE_FRONTEND_DIR ..."
    (
        cd "$MOBILE_FRONTEND_DIR"
        echo "Installing mobile-frontend dependencies using Yarn..."
        yarn install
    )
    echo "Mobile Frontend setup complete."
else
    echo "Warning: Mobile Frontend directory '$MOBILE_FRONTEND_DIR' not found. Skipping mobile-frontend setup."
fi

# --- Final Instructions ---
echo "-----------------------------------------------------------------------------"
echo "LendSmart Development Environment Setup Script Finished!"
echo "-----------------------------------------------------------------------------"
echo "Summary:"
echo "  - Python venv created/updated at: $VENV_PATH"
echo "  - Backend dependencies installed."
echo "  - Web Frontend dependencies installed."
echo "  - Mobile Frontend dependencies installed."
echo "  - Global tools (Node.js, npm, Yarn, Truffle, React Native CLI) installed/checked."
echo ""
echo "To run the application, use the run script:"
echo "  $ $PROJECT_ROOT/scripts/run_lendsmart.sh"
echo ""
echo "To run linting and formatting:"
echo "  $ $PROJECT_ROOT/scripts/lint-all.sh"
echo ""
echo "Please ensure you have configured your environment variables in $PROJECT_ROOT/env.example"
echo "and copied them to a file named '.env' or similar, as required by the application."

#!/bin/bash

# LendSmart Environment Setup Script
# This script automates the setup of the development environment for the LendSmart project.
# It assumes it is being run from the root of the LendSmart project directory.

echo "Starting LendSmart Environment Setup..."

# -----------------------------------------------------------------------------
# Helper function to check if a command exists
# -----------------------------------------------------------------------------
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# -----------------------------------------------------------------------------
# Install System-Level Dependencies
# -----------------------------------------------------------------------------
echo "Updating package lists..."
sudo apt-get update -y

echo "Installing system-level dependencies..."

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

# Install Node.js and npm (Node.js >=18, using 20.x for consistency with sandbox)
if ! command_exists node; then
    echo "Installing Node.js (>=18, aiming for 20.x) and npm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js is already installed. Verifying version (>=18 recommended)..."
    node -v
fi

if ! command_exists npm; then
    echo "npm not found, attempting to install..."
    sudo apt-get install -y npm
else
    echo "npm is already installed. Verifying version..."
    npm -v
fi

# Install Yarn
if ! command_exists yarn; then
    echo "Installing Yarn..."
    if command_exists npm; then
        NPM_PATH=$(which npm)
        sudo "$NPM_PATH" install --global yarn
        if ! command_exists yarn; then
             echo "Yarn installation may have failed. Please check logs."
        fi
    else
        echo "Error: npm command not found. Cannot install Yarn."
    fi
else
    echo "Yarn is already installed."
fi

# Install Truffle CLI (globally, for code/blockchain)
if ! command_exists truffle; then
    echo "Installing Truffle CLI..."
    if command_exists npm; then
        NPM_PATH=$(which npm)
        sudo "$NPM_PATH" install --global truffle
        if ! command_exists truffle; then
            echo "Truffle CLI installation may have failed. Please check logs."
        fi
    else
        echo "Error: npm command not found. Cannot install Truffle CLI."
    fi
else
    echo "Truffle CLI is already installed."
fi

# Install React Native CLI (globally, for mobile-frontend)
if ! command_exists react-native; then
    echo "Installing React Native CLI..."
    if command_exists npm; then
        NPM_PATH=$(which npm)
        sudo "$NPM_PATH" install --global react-native-cli
        if ! command_exists react-native; then
            echo "React Native CLI installation may have failed. Please check logs."
        fi
    else
        echo "Error: npm command not found. Cannot install React Native CLI."
    fi
else
    echo "React Native CLI is already installed."
fi

echo "System-level dependencies installation check complete."

# -----------------------------------------------------------------------------
# Project Component Setup
# Paths are relative to the script's location (LendSmart project root)
# -----------------------------------------------------------------------------

# Backend Setup (Python/Flask)
BACKEND_DIR="./code/backend"
if [ -d "$BACKEND_DIR" ]; then
    echo "Setting up Backend (Python/Flask) in $BACKEND_DIR ..."
    # Create a virtual environment in the project root as per run_lendsmart.sh
    if [ ! -d "./venv" ]; then
        echo "Creating Python virtual environment for backend in project root (./venv)..."
        python3 -m venv ./venv
    fi
    echo "Activating virtual environment and installing backend dependencies..."
    source ./venv/bin/activate
    pip install -r "$BACKEND_DIR/requirements.txt"
    deactivate
    echo "Backend setup complete."
else
    echo "Warning: Backend directory 
al$BACKEND_DIR' not found. Skipping backend setup."
fi

# Blockchain Setup (Solidity/Truffle)
CODE_BLOCKCHAIN_DIR="./code/blockchain"
if [ -d "$CODE_BLOCKCHAIN_DIR" ]; then
    echo "Info: Blockchain (Truffle) component found in $CODE_BLOCKCHAIN_DIR."
    echo "Truffle CLI has been installed globally. Use 'truffle compile', 'truffle migrate', etc., within this directory ($CODE_BLOCKCHAIN_DIR)."
    echo "Blockchain component check complete."
else
    echo "Warning: Blockchain directory 
al$CODE_BLOCKCHAIN_DIR' not found. Skipping blockchain setup."
fi

# Web Frontend Setup (React/react-scripts)
WEB_FRONTEND_DIR="./code/web-frontend"
if [ -d "$WEB_FRONTEND_DIR" ]; then
    echo "Setting up Web Frontend (React/react-scripts) in $WEB_FRONTEND_DIR ..."
    cd "$WEB_FRONTEND_DIR"
    echo "Installing web-frontend dependencies..."
    npm install
    echo "Web Frontend setup complete."
    cd - > /dev/null
else
    echo "Warning: Web Frontend directory 
al$WEB_FRONTEND_DIR' not found. Skipping web-frontend setup."
fi

# Mobile Frontend Setup (React Native)
MOBILE_FRONTEND_DIR="./mobile-frontend"
if [ -d "$MOBILE_FRONTEND_DIR" ]; then
    echo "Setting up Mobile Frontend (React Native) in $MOBILE_FRONTEND_DIR ..."
    cd "$MOBILE_FRONTEND_DIR"
    echo "Installing mobile-frontend dependencies using Yarn..."
    yarn install
    echo "Mobile Frontend setup complete."
    cd - > /dev/null
else
    echo "Warning: Mobile Frontend directory 
al$MOBILE_FRONTEND_DIR' not found. Skipping mobile-frontend setup."
fi

# -----------------------------------------------------------------------------
# AI Models Information
# -----------------------------------------------------------------------------
AI_MODELS_DIR="./code/ai_models"
if [ -d "$AI_MODELS_DIR" ]; then
    echo ""
    echo "Info: AI Models are located in $AI_MODELS_DIR."
    echo "Dependencies for using these models (e.g., scikit-learn, pandas) should be covered by the backend's requirements.txt."
    echo "Training scripts are also present. Ensure the Python environment (./venv) has all necessary libraries if you plan to retrain models."
fi

# -----------------------------------------------------------------------------
# Infrastructure Tools (Informational)
# -----------------------------------------------------------------------------
INFRA_DIR="./infrastructure"
if [ -d "$INFRA_DIR" ]; then
    echo ""
    echo "-----------------------------------------------------------------------------"
    echo "Infrastructure Tools (e.g., Docker, Kubernetes, Terraform - check contents):"
    echo "The project includes an 
al$INFRA_DIR' directory. Their setup is beyond the scope of this"
    echo "basic development environment script. Please refer to their respective"
    echo "documentation and the project's infrastructure guides for setup if needed."
    echo "-----------------------------------------------------------------------------"
fi

# -----------------------------------------------------------------------------
# Final Instructions
# -----------------------------------------------------------------------------
echo ""
echo "LendSmart Development Environment Setup Script Finished!"
echo "---------------------------------------------------------"
echo "Summary of components and their setup locations:"
echo "  - Backend (Python/Flask): ./code/backend/ (uses shared venv in ./venv/)"
echo "  - Blockchain (Solidity/Truffle): ./code/blockchain/ (uses global Truffle CLI)"
echo "  - Web Frontend (React/react-scripts): ./code/web-frontend/"
echo "  - Mobile Frontend (React Native): ./mobile-frontend/ (uses global React Native CLI)"
echo "  - AI Models: ./code/ai_models/"

echo ""
echo "To run the project, you will likely need to start each component separately in its own terminal."
echo "Refer to the project's README.md, individual component READMEs (if any), and the package.json/script files within each component for specific run commands."
echo "The existing 'run_lendsmart.sh' script might offer a simplified way to run the backend and web-frontend."

echo ""
echo "Remember to check for any specific Node.js (>=18) or Python version requirements if you encounter issues during runtime."

chmod +x ./setup_lendsmart_env.sh
echo "Made the script executable: ./setup_lendsmart_env.sh"

echo "Setup script created at ./setup_lendsmart_env.sh"


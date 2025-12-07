#!/bin/bash

# Optimized Linting and Fixing Script for LendSmart Project (Python, JavaScript, YAML, Terraform)

# Exit immediately if a command exits with a non-zero status, treat unset variables as an error, and fail if any command in a pipeline fails
set -euo pipefail

echo "----------------------------------------"
echo "Starting optimized linting and fixing process for LendSmart..."
echo "----------------------------------------"

# --- Configuration ---
# Use 'pwd' as a fallback if git is not available, but assume it's run from the project root
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
VENV_PATH="$PROJECT_ROOT/venv"
BACKEND_DIR="$PROJECT_ROOT/code/backend"
WEB_FRONTEND_DIR="$PROJECT_ROOT/web-frontend"
MOBILE_FRONTEND_DIR="$PROJECT_ROOT/mobile-frontend"

# Check if we are in the project root
if [ ! -d "$PROJECT_ROOT/code" ]; then
    echo "Error: Must be run from the LendSmart project root directory."
    exit 1
fi

# --- Helper Functions ---

# Function to check if a command exists (globally or via npx)
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check for Python Virtual Environment and install tools if necessary
check_python_venv() {
    if [ ! -d "$VENV_PATH" ]; then
        echo "Error: Python virtual environment not found at $VENV_PATH. Run setup_lendsmart_env.sh first."
        exit 1
    fi

    # Activate venv to ensure local tools are used
    source "$VENV_PATH/bin/activate"

    # Check for required Python linting tools and install if missing
    echo "Checking for required Python linting tools..."
    PYTHON_TOOLS=("black" "isort" "flake8" "pylint" "pyyaml")
    INSTALL_NEEDED=false
    for tool in "${PYTHON_TOOLS[@]}"; do
        if ! command_exists "$tool"; then
            echo "Warning: $tool not found in venv. Will install/upgrade."
            INSTALL_NEEDED=true
            break
        fi
    done

    if [ "$INSTALL_NEEDED" = true ]; then
        echo "Installing/Updating Python linting tools in venv..."
        # Use a temporary requirements file to ensure all tools are installed together
        echo "black" > /tmp/lint_requirements.txt
        echo "isort" >> /tmp/lint_requirements.txt
        echo "flake8" >> /tmp/lint_requirements.txt
        echo "pylint" >> /tmp/lint_requirements.txt
        echo "pyyaml" >> /tmp/lint_requirements.txt
        pip install --upgrade -r /tmp/lint_requirements.txt
        rm /tmp/lint_requirements.txt
    fi
    
    # Deactivate venv after setup/check to allow explicit activation later or use full path
    deactivate
}

# Check and install Python tools
check_python_venv

# --- Tool Availability Checks (for non-Python tools) ---

TERRAFORM_AVAILABLE=false
if command_exists terraform; then
    echo "terraform is installed."
    TERRAFORM_AVAILABLE=true
else
    echo "Warning: terraform is not installed. Terraform validation will be limited."
fi

YAMLLINT_AVAILABLE=false
if command_exists yamllint; then
    echo "yamllint is installed."
    YAMLLINT_AVAILABLE=true
else
    echo "Warning: yamllint is not installed. YAML validation will be limited."
fi

# --- Define Directories to Process ---

PYTHON_DIRECTORIES=(
  "$BACKEND_DIR"
)

JS_DIRECTORIES=(
  "$WEB_FRONTEND_DIR/src"
  "$MOBILE_FRONTEND_DIR/src"
)

YAML_DIRECTORIES=(
  "$PROJECT_ROOT/infrastructure/kubernetes"
  "$PROJECT_ROOT/infrastructure/ansible"
  "$PROJECT_ROOT/.github/workflows"
)

TERRAFORM_DIRECTORIES=(
  "$PROJECT_ROOT/infrastructure/terraform"
)

# --- 1. Python Linting ---
echo "----------------------------------------"
echo "Running Python linting tools..."

# Activate venv for Python tools
source "$VENV_PATH/bin/activate"

# 1.1 Run Black (code formatter)
echo "Running Black code formatter..."
for dir in "${PYTHON_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Formatting Python files in $dir..."
    # Use --check and --diff first to see changes, then run without for fixing
    black "$dir" || {
      echo "Black encountered issues in $dir. Please review the above errors."
    }
  else
    echo "Directory $dir not found. Skipping Black formatting for this directory."
  fi
done
echo "Black formatting completed."

# 1.2 Run isort (import sorter)
echo "Running isort to sort imports..."
for dir in "${PYTHON_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Sorting imports in Python files in $dir..."
    isort "$dir" || {
      echo "isort encountered issues in $dir. Please review the above errors."
    }
  else
    echo "Directory $dir not found. Skipping isort for this directory."
  fi
done
echo "Import sorting completed."

# 1.3 Run flake8 (linter)
echo "Running flake8 linter..."
for dir in "${PYTHON_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Linting Python files in $dir with flake8..."
    # Use --exit-zero to report issues but not fail the script immediately
    flake8 "$dir" || {
      echo "Flake8 found issues in $dir. Please review the above warnings/errors."
    }
  else
    echo "Directory $dir not found. Skipping flake8 for this directory."
  fi
done
echo "Flake8 linting completed."

# 1.4 Run pylint (more comprehensive linter)
echo "Running pylint for more comprehensive linting..."
for dir in "${PYTHON_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Linting Python files in $dir with pylint..."
    # Use find with -print0 and xargs -0 for robust handling of filenames with spaces
    find "$dir" -type f -name "*.py" -print0 | xargs -0 pylint --disable=C0111,C0103,C0303,W0621,C0301,W0612,W0611,R0913,R0914,R0915 || {
      echo "Pylint found issues in $dir. Please review the above warnings/errors."
    }
  else
    echo "Directory $dir not found. Skipping pylint for this directory."
  fi
done
echo "Pylint linting completed."

# Deactivate venv
deactivate

# --- 2. JavaScript/TypeScript Linting ---
echo "----------------------------------------"
echo "Running JavaScript/TypeScript linting tools..."

# 2.1 Run ESLint
echo "Running ESLint for JavaScript/TypeScript files..."
for dir in "${JS_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Linting JavaScript/TypeScript files in $dir with ESLint..."
    # Use npx to run locally installed eslint
    (cd "$PROJECT_ROOT" && npx eslint "$dir" --ext .js,.jsx,.ts,.tsx --fix) || {
      echo "ESLint found issues in $dir. Please review the above warnings/errors."
    }
  else
    echo "Directory $dir not found. Skipping ESLint for this directory."
  fi
done
echo "ESLint linting completed."

# 2.2 Run Prettier
echo "Running Prettier for JavaScript/TypeScript files..."
for dir in "${JS_DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    echo "Formatting JavaScript/TypeScript files in $dir with Prettier..."
    # Use npx to run locally installed prettier
    (cd "$PROJECT_ROOT" && npx prettier --write "$dir/**/*.{js,jsx,ts,tsx}") || {
      echo "Prettier encountered issues in $dir. Please review the above errors."
    }
  else
    echo "Directory $dir not found. Skipping Prettier for this directory."
  fi
done
echo "Prettier formatting completed."

# --- 3. YAML Linting ---
echo "----------------------------------------"
echo "Running YAML linting tools..."

if [ "$YAMLLINT_AVAILABLE" = true ]; then
  echo "Running yamllint for YAML files..."
  for dir in "${YAML_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
      echo "Linting YAML files in $dir with yamllint..."
      yamllint "$dir" || {
        echo "yamllint found issues in $dir. Please review the above warnings/errors."
      }
    else
      echo "Directory $dir not found. Skipping yamllint for this directory."
    fi
  done
  echo "yamllint completed."
else
  echo "Skipping yamllint (not installed). Performing basic YAML validation using Python..."
  
  # Activate venv for Python tools
  source "$VENV_PATH/bin/activate"
  
  for dir in "${YAML_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
      echo "Validating YAML files in $dir..."
      # Use find with -print0 and xargs -0 for robust handling of filenames with spaces
      find "$dir" -type f \( -name "*.yaml" -o -name "*.yml" \) -print0 | xargs -0 python3 -c "
import yaml, sys
for filename in sys.argv[1:]:
    try:
        with open(filename, 'r') as f:
            yaml.safe_load(f)
        # print(f'OK: {filename}') # Optional: print success
    except Exception as e:
        print(f'Error in {filename}: {e}', file=sys.stderr)
        sys.exit(1) # Exit on first error to stop xargs
" || {
        echo "YAML validation found issues in $dir. Please review the above errors."
      }
    else
      echo "Directory $dir not found. Skipping YAML validation for this directory."
    fi
  done
  echo "Basic YAML validation completed."
  
  # Deactivate venv
  deactivate
fi

# --- 4. Terraform Linting ---
echo "----------------------------------------"
echo "Running Terraform linting tools..."

if [ "$TERRAFORM_AVAILABLE" = true ]; then
  echo "Running terraform fmt for Terraform files..."
  for dir in "${TERRAFORM_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
      echo "Formatting Terraform files in $dir..."
      (cd "$dir" && terraform fmt -recursive) || {
        echo "terraform fmt encountered issues in $dir. Please review the above errors."
      }
    else
      echo "Directory $dir not found. Skipping terraform fmt for this directory."
    fi
  done
  echo "terraform fmt completed."

  echo "Running terraform validate for Terraform files..."
  for dir in "${TERRAFORM_DIRECTORIES[@]}"; do
    if [ -d "$dir" ]; then
      echo "Validating Terraform files in $dir..."
      # Initialize without backend to speed up validation
      (cd "$dir" && terraform init -backend=false && terraform validate) || {
        echo "terraform validate encountered issues in $dir. Please review the above errors."
      }
    else
      echo "Directory $dir not found. Skipping terraform validate for this directory."
    fi
  done
  echo "terraform validate completed."
else
  echo "Skipping Terraform linting (terraform not installed)."
fi

echo "----------------------------------------"
echo "Linting and fixing process for LendSmart completed!"
echo "----------------------------------------"

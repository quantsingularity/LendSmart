#!/bin/bash

# Kubernetes Deployment Script for LendSmart Project

# Exit immediately if a command exits with a non-zero status, treat unset variables as an error, and fail if any command in a pipeline fails
set -euo pipefail

# --- Configuration ---
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
K8S_MANIFESTS_DIR="$PROJECT_ROOT/infrastructure/kubernetes"

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Kubernetes Deployment Process for LendSmart...${NC}"

# --- Pre-flight Checks ---
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed. Please install kubectl to deploy to Kubernetes.${NC}"
    exit 1
fi

if [ ! -d "$K8S_MANIFESTS_DIR" ]; then
    echo -e "${RED}Error: Kubernetes manifests directory '$K8S_MANIFESTS_DIR' not found.${NC}"
    exit 1
fi

# --- Deployment ---
echo -e "${BLUE}Applying Kubernetes manifests from $K8S_MANIFESTS_DIR...${NC}"

# Apply all YAML files in the manifests directory
kubectl apply -f "$K8S_MANIFESTS_DIR"

echo -e "${GREEN}Kubernetes manifests applied successfully.${NC}"

# --- Verification ---
echo -e "${BLUE}Verifying deployment status...${NC}"

# Wait for all deployments to be ready (adjust timeout as needed)
kubectl wait --for=condition=available deployment --all --timeout=300s

echo -e "${GREEN}All LendSmart deployments are ready!${NC}"

# --- Final Instructions ---
echo -e "${BLUE}To check the status of your pods, run:${NC}"
echo "  kubectl get pods"
echo -e "${BLUE}To check the services, run:${NC}"
echo "  kubectl get services"

echo -e "${GREEN}Kubernetes Deployment Process Completed!${NC}"

#!/bin/bash
# smart_contract_manager.sh - Smart Contract Management Script for LendSmart
# This script provides utilities for managing smart contract deployment, verification,
# and interaction across different networks (local, testnet, mainnet)

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory (assuming script is run from project root)
PROJECT_ROOT=$(pwd)
CONTRACTS_DIR="$PROJECT_ROOT/smart-contracts"
DEPLOYMENT_DIR="$CONTRACTS_DIR/deployments"
LOGS_DIR="$CONTRACTS_DIR/logs"

# Create necessary directories
mkdir -p "$DEPLOYMENT_DIR"
mkdir -p "$LOGS_DIR"

# Available networks
NETWORKS=("localhost" "sepolia" "goerli" "mainnet")

# Function to display help
show_help() {
    echo -e "${BLUE}LendSmart Smart Contract Manager${NC}"
    echo ""
    echo "Usage: ./smart_contract_manager.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  compile                Compile all smart contracts"
    echo "  deploy [NETWORK]       Deploy contracts to specified network"
    echo "  verify [NETWORK]       Verify contracts on block explorer (if supported)"
    echo "  interact [NETWORK]     Start interactive console for contract interaction"
    echo "  status [NETWORK]       Show deployment status and addresses"
    echo "  gas-report             Generate gas usage report"
    echo "  flatten [CONTRACT]     Flatten a contract for verification"
    echo "  clean                  Remove artifacts and cache"
    echo ""
    echo "Networks: ${NETWORKS[*]}"
    echo ""
    echo "Examples:"
    echo "  ./smart_contract_manager.sh compile"
    echo "  ./smart_contract_manager.sh deploy sepolia"
    echo "  ./smart_contract_manager.sh verify sepolia"
    echo "  ./smart_contract_manager.sh status mainnet"
    echo ""
}

# Function to validate network
validate_network() {
    local network=$1
    for n in "${NETWORKS[@]}"; do
        if [[ "$n" == "$network" ]]; then
            return 0
        fi
    done
    echo -e "${RED}Error: Invalid network '$network'${NC}"
    echo -e "Available networks: ${NETWORKS[*]}"
    return 1
}

# Function to check if Hardhat is installed
check_hardhat() {
    if [ ! -f "$CONTRACTS_DIR/package.json" ]; then
        echo -e "${RED}Error: No package.json found in $CONTRACTS_DIR${NC}"
        echo "Make sure you're running this script from the project root directory."
        return 1
    fi

    if ! grep -q "hardhat" "$CONTRACTS_DIR/package.json"; then
        echo -e "${YELLOW}Warning: Hardhat not found in package.json${NC}"
        echo "Installing Hardhat..."
        cd "$CONTRACTS_DIR"
        npm install --save-dev hardhat
        cd "$PROJECT_ROOT"
    fi

    return 0
}

# Function to compile contracts
compile_contracts() {
    echo -e "${BLUE}Compiling smart contracts...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Clean artifacts first
    npx hardhat clean

    # Compile contracts
    npx hardhat compile

    # Check compilation status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Compilation successful!${NC}"
    else
        echo -e "${RED}Compilation failed!${NC}"
        return 1
    fi

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to deploy contracts
deploy_contracts() {
    local network=$1

    # Validate network
    validate_network "$network" || return 1

    echo -e "${BLUE}Deploying smart contracts to $network...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Create timestamp for logs
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOGS_DIR/deploy_${network}_${timestamp}.log"

    # Deploy contracts
    echo -e "${YELLOW}Deployment started. This may take a while...${NC}"
    npx hardhat run scripts/deploy.js --network "$network" | tee "$log_file"

    # Check deployment status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment to $network successful!${NC}"
        echo -e "Deployment log saved to: $log_file"

        # Extract deployed addresses from log file
        grep -i "deployed to" "$log_file" > "$DEPLOYMENT_DIR/${network}_addresses.txt"
        echo -e "Deployment addresses saved to: $DEPLOYMENT_DIR/${network}_addresses.txt"
    else
        echo -e "${RED}Deployment to $network failed!${NC}"
        echo -e "Check the log file for details: $log_file"
        return 1
    fi

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to verify contracts
verify_contracts() {
    local network=$1

    # Validate network
    validate_network "$network" || return 1

    # Skip verification for localhost
    if [ "$network" == "localhost" ]; then
        echo -e "${YELLOW}Verification not needed for localhost network${NC}"
        return 0
    fi

    echo -e "${BLUE}Verifying smart contracts on $network...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Check if deployment addresses exist
    local addresses_file="$DEPLOYMENT_DIR/${network}_addresses.txt"
    if [ ! -f "$addresses_file" ]; then
        echo -e "${RED}Error: No deployment addresses found for $network${NC}"
        echo "Please deploy contracts to $network first."
        return 1
    fi

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Create timestamp for logs
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOGS_DIR/verify_${network}_${timestamp}.log"

    # Verify each contract
    echo -e "${YELLOW}Verification started. This may take a while...${NC}"
    while IFS= read -r line; do
        if [[ "$line" =~ deployed\ to:?\ *(0x[a-fA-F0-9]+) ]]; then
            local contract_address="${BASH_REMATCH[1]}"
            echo -e "Verifying contract at address: $contract_address"
            npx hardhat verify --network "$network" "$contract_address" | tee -a "$log_file"
        fi
    done < "$addresses_file"

    echo -e "${GREEN}Verification process completed!${NC}"
    echo -e "Verification log saved to: $log_file"

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to start interactive console
start_console() {
    local network=$1

    # Validate network
    validate_network "$network" || return 1

    echo -e "${BLUE}Starting interactive console for $network...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Start console
    npx hardhat console --network "$network"

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to show deployment status
show_status() {
    local network=$1

    # Validate network
    validate_network "$network" || return 1

    echo -e "${BLUE}Deployment status for $network:${NC}"

    # Check if deployment addresses exist
    local addresses_file="$DEPLOYMENT_DIR/${network}_addresses.txt"
    if [ ! -f "$addresses_file" ]; then
        echo -e "${YELLOW}No deployment information found for $network${NC}"
        return 0
    fi

    # Display deployment information
    echo -e "${GREEN}Deployed contracts:${NC}"
    cat "$addresses_file"

    return 0
}

# Function to generate gas report
generate_gas_report() {
    echo -e "${BLUE}Generating gas usage report...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Create timestamp for report
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$LOGS_DIR/gas_report_${timestamp}.txt"

    # Set environment variable for gas reporting
    export REPORT_GAS=true

    # Run tests with gas reporting
    npx hardhat test | tee "$report_file"

    # Unset environment variable
    unset REPORT_GAS

    echo -e "${GREEN}Gas report generated!${NC}"
    echo -e "Report saved to: $report_file"

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to flatten a contract
flatten_contract() {
    local contract=$1

    if [ -z "$contract" ]; then
        echo -e "${RED}Error: No contract specified${NC}"
        echo "Usage: ./smart_contract_manager.sh flatten path/to/Contract.sol"
        return 1
    fi

    echo -e "${BLUE}Flattening contract: $contract${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Check if contract file exists
    local contract_path="$CONTRACTS_DIR/contracts/$contract"
    if [ ! -f "$contract_path" ]; then
        echo -e "${RED}Error: Contract file not found: $contract_path${NC}"
        return 1
    fi

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Create output file name
    local output_file="$CONTRACTS_DIR/flattened/$(basename "$contract" .sol)_flattened.sol"
    mkdir -p "$(dirname "$output_file")"

    # Flatten contract
    npx hardhat flatten "$contract_path" > "$output_file"

    echo -e "${GREEN}Contract flattened successfully!${NC}"
    echo -e "Flattened contract saved to: $output_file"

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Function to clean artifacts and cache
clean_artifacts() {
    echo -e "${BLUE}Cleaning artifacts and cache...${NC}"

    # Check if Hardhat is installed
    check_hardhat || return 1

    # Navigate to contracts directory
    cd "$CONTRACTS_DIR"

    # Clean artifacts
    npx hardhat clean

    echo -e "${GREEN}Artifacts and cache cleaned!${NC}"

    # Return to project root
    cd "$PROJECT_ROOT"
    return 0
}

# Main function
main() {
    # Check if contracts directory exists
    if [ ! -d "$CONTRACTS_DIR" ]; then
        echo -e "${RED}Error: Smart contracts directory not found: $CONTRACTS_DIR${NC}"
        echo "Make sure you're running this script from the project root directory."
        return 1
    fi

    # Parse command
    local command=$1
    shift

    case "$command" in
        compile)
            compile_contracts
            ;;
        deploy)
            local network=$1
            if [ -z "$network" ]; then
                echo -e "${RED}Error: No network specified${NC}"
                echo "Usage: ./smart_contract_manager.sh deploy [NETWORK]"
                return 1
            fi
            deploy_contracts "$network"
            ;;
        verify)
            local network=$1
            if [ -z "$network" ]; then
                echo -e "${RED}Error: No network specified${NC}"
                echo "Usage: ./smart_contract_manager.sh verify [NETWORK]"
                return 1
            fi
            verify_contracts "$network"
            ;;
        interact)
            local network=$1
            if [ -z "$network" ]; then
                echo -e "${RED}Error: No network specified${NC}"
                echo "Usage: ./smart_contract_manager.sh interact [NETWORK]"
                return 1
            fi
            start_console "$network"
            ;;
        status)
            local network=$1
            if [ -z "$network" ]; then
                echo -e "${RED}Error: No network specified${NC}"
                echo "Usage: ./smart_contract_manager.sh status [NETWORK]"
                return 1
            fi
            show_status "$network"
            ;;
        gas-report)
            generate_gas_report
            ;;
        flatten)
            local contract=$1
            if [ -z "$contract" ]; then
                echo -e "${RED}Error: No contract specified${NC}"
                echo "Usage: ./smart_contract_manager.sh flatten path/to/Contract.sol"
                return 1
            fi
            flatten_contract "$contract"
            ;;
        clean)
            clean_artifacts
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

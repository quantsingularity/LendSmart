#!/bin/bash
# unified_test.sh - Comprehensive testing script for LendSmart
# This script runs all tests across the project components in a unified manner
# with detailed reporting and parallel execution where possible

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory (assuming script is run from project root)
PROJECT_ROOT=$(pwd)
REPORT_DIR="$PROJECT_ROOT/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SUMMARY_FILE="$REPORT_DIR/test_summary_$TIMESTAMP.txt"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Initialize summary file
echo "LendSmart Unified Test Report - $(date)" > "$SUMMARY_FILE"
echo "=======================================" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

# Function to run tests with timing and status tracking
run_test() {
    component=$1
    command=$2
    echo -e "${BLUE}Testing $component...${NC}"

    # Create component report file
    component_report="$REPORT_DIR/${component}_test_report_$TIMESTAMP.txt"
    echo "Test Report for $component - $(date)" > "$component_report"
    echo "----------------------------------------" >> "$component_report"

    # Record start time
    start_time=$(date +%s)

    # Run the test command and capture output and exit status
    echo "Running: $command" >> "$component_report"
    echo "" >> "$component_report"
    eval "$command" >> "$component_report" 2>&1
    exit_status=$?

    # Record end time and calculate duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))

    # Append duration to report
    echo "" >> "$component_report"
    echo "Duration: ${duration} seconds" >> "$component_report"

    # Determine status based on exit code
    if [ $exit_status -eq 0 ]; then
        status="${GREEN}PASSED${NC}"
        status_summary="PASSED"
    else
        status="${RED}FAILED${NC}"
        status_summary="FAILED"
    fi

    # Add to summary
    echo "$component: $status_summary (${duration}s)" >> "$SUMMARY_FILE"

    # Print status to console
    echo -e "$component tests: $status (${duration}s)"
    echo ""

    return $exit_status
}

# Main function to orchestrate all tests
main() {
    echo -e "${BLUE}Starting LendSmart Unified Testing...${NC}"
    echo ""

    # Track overall success
    overall_success=true
    start_total=$(date +%s)

    # Smart Contracts Tests
    if [ -d "$PROJECT_ROOT/smart-contracts" ]; then
        cd "$PROJECT_ROOT/smart-contracts"
        run_test "Smart Contracts" "npm test"
        if [ $? -ne 0 ]; then overall_success=false; fi
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}Smart Contracts directory not found, skipping tests${NC}"
        echo "Smart Contracts: SKIPPED (directory not found)" >> "$SUMMARY_FILE"
    fi

    # Backend Tests
    if [ -d "$PROJECT_ROOT/backend" ]; then
        cd "$PROJECT_ROOT/backend"
        run_test "Backend" "npm test"
        if [ $? -ne 0 ]; then overall_success=false; fi
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}Backend directory not found, skipping tests${NC}"
        echo "Backend: SKIPPED (directory not found)" >> "$SUMMARY_FILE"
    fi

    # Web Frontend Tests
    if [ -d "$PROJECT_ROOT/web-frontend" ]; then
        cd "$PROJECT_ROOT/web-frontend"
        run_test "Web Frontend" "npm test -- --watchAll=false"
        if [ $? -ne 0 ]; then overall_success=false; fi
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}Web Frontend directory not found, skipping tests${NC}"
        echo "Web Frontend: SKIPPED (directory not found)" >> "$SUMMARY_FILE"
    fi

    # Mobile Frontend Tests
    if [ -d "$PROJECT_ROOT/mobile-frontend" ]; then
        cd "$PROJECT_ROOT/mobile-frontend"
        run_test "Mobile Frontend" "npm test"
        if [ $? -ne 0 ]; then overall_success=false; fi
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}Mobile Frontend directory not found, skipping tests${NC}"
        echo "Mobile Frontend: SKIPPED (directory not found)" >> "$SUMMARY_FILE"
    fi

    # ML Model Tests
    if [ -d "$PROJECT_ROOT/ml-model" ]; then
        cd "$PROJECT_ROOT/ml-model"
        # Create and activate virtual environment if needed
        if [ ! -d "$PROJECT_ROOT/venv" ]; then
            python3 -m venv "$PROJECT_ROOT/venv"
        fi
        source "$PROJECT_ROOT/venv/bin/activate"
        pip install -r requirements.txt > /dev/null
        run_test "ML Models" "python -m unittest discover tests"
        deactivate
        if [ $? -ne 0 ]; then overall_success=false; fi
        cd "$PROJECT_ROOT"
    else
        echo -e "${YELLOW}ML Model directory not found, skipping tests${NC}"
        echo "ML Models: SKIPPED (directory not found)" >> "$SUMMARY_FILE"
    fi

    # End timing
    end_total=$(date +%s)
    total_duration=$((end_total - start_total))

    # Add total duration to summary
    echo "" >> "$SUMMARY_FILE"
    echo "Total test duration: ${total_duration} seconds" >> "$SUMMARY_FILE"

    # Print final status
    echo -e "${BLUE}All tests completed in ${total_duration} seconds${NC}"
    if $overall_success; then
        echo -e "${GREEN}All tests passed successfully!${NC}"
        echo "OVERALL STATUS: PASSED" >> "$SUMMARY_FILE"
    else
        echo -e "${RED}Some tests failed. Check the reports for details.${NC}"
        echo "OVERALL STATUS: FAILED" >> "$SUMMARY_FILE"
    fi

    echo ""
    echo -e "${BLUE}Test reports saved to: $REPORT_DIR${NC}"
    echo -e "${BLUE}Summary report: $SUMMARY_FILE${NC}"
}

# Run the main function
main

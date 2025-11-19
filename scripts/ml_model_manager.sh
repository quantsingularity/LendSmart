#!/bin/bash
# ml_model_manager.sh - ML Model Management Script for LendSmart
# This script provides utilities for training, evaluating, and deploying ML models

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory (assuming script is run from project root)
PROJECT_ROOT=$(pwd)
ML_DIR="$PROJECT_ROOT/ml-model"
DATA_DIR="$ML_DIR/data"
MODELS_DIR="$ML_DIR/models"
LOGS_DIR="$ML_DIR/logs"
REPORTS_DIR="$ML_DIR/reports"

# Create necessary directories
mkdir -p "$DATA_DIR"
mkdir -p "$MODELS_DIR"
mkdir -p "$LOGS_DIR"
mkdir -p "$REPORTS_DIR"

# Available model types
MODEL_TYPES=("credit_scoring" "risk_assessment" "fraud_detection" "interest_rate")

# Function to display help
show_help() {
    echo -e "${BLUE}LendSmart ML Model Manager${NC}"
    echo ""
    echo "Usage: ./ml_model_manager.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  setup                  Setup Python environment and dependencies"
    echo "  train [MODEL_TYPE]     Train a specific model type"
    echo "  evaluate [MODEL_TYPE]  Evaluate a specific model type"
    echo "  deploy [MODEL_TYPE]    Deploy a specific model type to production"
    echo "  batch-predict [FILE]   Run batch predictions on input data file"
    echo "  performance            Generate performance report for all models"
    echo "  data-sync              Sync data from production database"
    echo "  clean                  Remove temporary files and logs"
    echo ""
    echo "Model Types: ${MODEL_TYPES[*]}"
    echo ""
    echo "Examples:"
    echo "  ./ml_model_manager.sh setup"
    echo "  ./ml_model_manager.sh train credit_scoring"
    echo "  ./ml_model_manager.sh evaluate risk_assessment"
    echo "  ./ml_model_manager.sh deploy fraud_detection"
    echo "  ./ml_model_manager.sh batch-predict input_data.csv"
    echo ""
}

# Function to validate model type
validate_model_type() {
    local model_type=$1
    for m in "${MODEL_TYPES[@]}"; do
        if [[ "$m" == "$model_type" ]]; then
            return 0
        fi
    done
    echo -e "${RED}Error: Invalid model type '$model_type'${NC}"
    echo -e "Available model types: ${MODEL_TYPES[*]}"
    return 1
}

# Function to setup Python environment
setup_environment() {
    echo -e "${BLUE}Setting up Python environment for ML models...${NC}"

    # Check if Python is installed
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 is not installed${NC}"
        return 1
    fi

    # Create virtual environment if it doesn't exist
    if [ ! -d "$PROJECT_ROOT/venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv "$PROJECT_ROOT/venv"
    fi

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Install dependencies
    echo -e "${YELLOW}Installing dependencies...${NC}"
    if [ -f "$ML_DIR/requirements.txt" ]; then
        pip install -r "$ML_DIR/requirements.txt"
    else
        echo -e "${YELLOW}No requirements.txt found, installing common ML packages...${NC}"
        pip install numpy pandas scikit-learn tensorflow joblib matplotlib seaborn

        # Create requirements.txt for future use
        pip freeze > "$ML_DIR/requirements.txt"
        echo -e "${GREEN}Created requirements.txt at $ML_DIR/requirements.txt${NC}"
    fi

    # Deactivate virtual environment
    deactivate

    echo -e "${GREEN}Python environment setup complete!${NC}"
    return 0
}

# Function to train a model
train_model() {
    local model_type=$1

    # Validate model type
    validate_model_type "$model_type" || return 1

    echo -e "${BLUE}Training $model_type model...${NC}"

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create timestamp for logs
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOGS_DIR/train_${model_type}_${timestamp}.log"

    # Run training script
    echo -e "${YELLOW}Training started. This may take a while...${NC}"

    # Check if specific training script exists
    if [ -f "$ML_DIR/train_${model_type}.py" ]; then
        python "$ML_DIR/train_${model_type}.py" | tee "$log_file"
    else
        # Use generic training script with model type as parameter
        python "$ML_DIR/train.py" --model "$model_type" | tee "$log_file"
    fi

    # Check training status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Training $model_type model successful!${NC}"
        echo -e "Training log saved to: $log_file"
    else
        echo -e "${RED}Training $model_type model failed!${NC}"
        echo -e "Check the log file for details: $log_file"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to evaluate a model
evaluate_model() {
    local model_type=$1

    # Validate model type
    validate_model_type "$model_type" || return 1

    echo -e "${BLUE}Evaluating $model_type model...${NC}"

    # Check if model exists
    if [ ! -f "$MODELS_DIR/${model_type}_model.pkl" ] && [ ! -f "$MODELS_DIR/${model_type}_model.h5" ]; then
        echo -e "${RED}Error: No trained model found for $model_type${NC}"
        echo "Please train the model first."
        return 1
    fi

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create timestamp for reports
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$REPORTS_DIR/evaluation_${model_type}_${timestamp}.pdf"

    # Run evaluation script
    echo -e "${YELLOW}Evaluation started...${NC}"

    # Check if specific evaluation script exists
    if [ -f "$ML_DIR/evaluate_${model_type}.py" ]; then
        python "$ML_DIR/evaluate_${model_type}.py" --output "$report_file"
    else
        # Use generic evaluation script with model type as parameter
        python "$ML_DIR/evaluate.py" --model "$model_type" --output "$report_file"
    fi

    # Check evaluation status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Evaluation of $model_type model successful!${NC}"
        echo -e "Evaluation report saved to: $report_file"
    else
        echo -e "${RED}Evaluation of $model_type model failed!${NC}"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to deploy a model
deploy_model() {
    local model_type=$1

    # Validate model type
    validate_model_type "$model_type" || return 1

    echo -e "${BLUE}Deploying $model_type model to production...${NC}"

    # Check if model exists
    if [ ! -f "$MODELS_DIR/${model_type}_model.pkl" ] && [ ! -f "$MODELS_DIR/${model_type}_model.h5" ]; then
        echo -e "${RED}Error: No trained model found for $model_type${NC}"
        echo "Please train the model first."
        return 1
    fi

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create timestamp for logs
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOGS_DIR/deploy_${model_type}_${timestamp}.log"

    # Run deployment script
    echo -e "${YELLOW}Deployment started...${NC}"

    # Check if specific deployment script exists
    if [ -f "$ML_DIR/deploy_${model_type}.py" ]; then
        python "$ML_DIR/deploy_${model_type}.py" | tee "$log_file"
    else
        # Use generic deployment script with model type as parameter
        python "$ML_DIR/deploy.py" --model "$model_type" | tee "$log_file"
    fi

    # Check deployment status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment of $model_type model successful!${NC}"
        echo -e "Deployment log saved to: $log_file"
    else
        echo -e "${RED}Deployment of $model_type model failed!${NC}"
        echo -e "Check the log file for details: $log_file"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to run batch predictions
batch_predict() {
    local input_file=$1

    if [ -z "$input_file" ]; then
        echo -e "${RED}Error: No input file specified${NC}"
        echo "Usage: ./ml_model_manager.sh batch-predict path/to/input_file.csv"
        return 1
    fi

    echo -e "${BLUE}Running batch predictions on $input_file...${NC}"

    # Check if input file exists
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}Error: Input file not found: $input_file${NC}"
        return 1
    fi

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create output file name
    local output_file="${input_file%.*}_predictions.csv"

    # Run prediction script
    echo -e "${YELLOW}Batch prediction started...${NC}"
    python "$ML_DIR/batch_predict.py" --input "$input_file" --output "$output_file"

    # Check prediction status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Batch prediction successful!${NC}"
        echo -e "Predictions saved to: $output_file"
    else
        echo -e "${RED}Batch prediction failed!${NC}"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to generate performance report
generate_performance_report() {
    echo -e "${BLUE}Generating performance report for all models...${NC}"

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create timestamp for report
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$REPORTS_DIR/performance_report_${timestamp}.pdf"

    # Run performance report script
    echo -e "${YELLOW}Generating performance report...${NC}"
    python "$ML_DIR/performance_report.py" --output "$report_file"

    # Check report generation status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Performance report generated successfully!${NC}"
        echo -e "Report saved to: $report_file"
    else
        echo -e "${RED}Performance report generation failed!${NC}"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to sync data from production
sync_data() {
    echo -e "${BLUE}Syncing data from production database...${NC}"

    # Activate virtual environment
    source "$PROJECT_ROOT/venv/bin/activate"

    # Create timestamp for logs
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="$LOGS_DIR/data_sync_${timestamp}.log"

    # Run data sync script
    echo -e "${YELLOW}Data sync started...${NC}"
    python "$ML_DIR/data_sync.py" | tee "$log_file"

    # Check sync status
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Data sync successful!${NC}"
        echo -e "Sync log saved to: $log_file"
    else
        echo -e "${RED}Data sync failed!${NC}"
        echo -e "Check the log file for details: $log_file"
        deactivate
        return 1
    fi

    # Deactivate virtual environment
    deactivate

    return 0
}

# Function to clean temporary files
clean_temp_files() {
    echo -e "${BLUE}Cleaning temporary files and logs...${NC}"

    # Remove old log files (older than 30 days)
    find "$LOGS_DIR" -type f -name "*.log" -mtime +30 -delete

    # Remove temporary files
    find "$ML_DIR" -type f -name "*.tmp" -delete
    find "$ML_DIR" -type f -name "*.pyc" -delete

    # Remove __pycache__ directories
    find "$ML_DIR" -type d -name "__pycache__" -exec rm -rf {} +

    echo -e "${GREEN}Temporary files and logs cleaned!${NC}"

    return 0
}

# Main function
main() {
    # Check if ML directory exists
    if [ ! -d "$ML_DIR" ]; then
        echo -e "${RED}Error: ML model directory not found: $ML_DIR${NC}"
        echo "Make sure you're running this script from the project root directory."
        return 1
    fi

    # Parse command
    local command=$1
    shift

    case "$command" in
        setup)
            setup_environment
            ;;
        train)
            local model_type=$1
            if [ -z "$model_type" ]; then
                echo -e "${RED}Error: No model type specified${NC}"
                echo "Usage: ./ml_model_manager.sh train [MODEL_TYPE]"
                return 1
            fi
            train_model "$model_type"
            ;;
        evaluate)
            local model_type=$1
            if [ -z "$model_type" ]; then
                echo -e "${RED}Error: No model type specified${NC}"
                echo "Usage: ./ml_model_manager.sh evaluate [MODEL_TYPE]"
                return 1
            fi
            evaluate_model "$model_type"
            ;;
        deploy)
            local model_type=$1
            if [ -z "$model_type" ]; then
                echo -e "${RED}Error: No model type specified${NC}"
                echo "Usage: ./ml_model_manager.sh deploy [MODEL_TYPE]"
                return 1
            fi
            deploy_model "$model_type"
            ;;
        batch-predict)
            local input_file=$1
            if [ -z "$input_file" ]; then
                echo -e "${RED}Error: No input file specified${NC}"
                echo "Usage: ./ml_model_manager.sh batch-predict [FILE]"
                return 1
            fi
            batch_predict "$input_file"
            ;;
        performance)
            generate_performance_report
            ;;
        data-sync)
            sync_data
            ;;
        clean)
            clean_temp_files
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

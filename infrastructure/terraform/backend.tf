# Backend Configuration
# 
# For local development, Terraform uses local state (default)
# For team/production use, uncomment and configure S3 backend below
#
# terraform {
#   backend "s3" {
#     bucket         = "lendsmart-terraform-state"
#     key            = "infrastructure/terraform.tfstate"
#     region         = "us-west-2"
#     encrypt        = true
#     dynamodb_table = "lendsmart-terraform-locks"
#   }
# }
#
# To set up S3 backend:
# 1. Create S3 bucket: aws s3 mb s3://lendsmart-terraform-state
# 2. Create DynamoDB table: 
#    aws dynamodb create-table \
#      --table-name lendsmart-terraform-locks \
#      --attribute-definitions AttributeName=LockID,AttributeType=S \
#      --key-schema AttributeName=LockID,KeyType=HASH \
#      --billing-mode PAY_PER_REQUEST
# 3. Uncomment the backend block above
# 4. Run: terraform init -migrate-state

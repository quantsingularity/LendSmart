variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
}

variable "bucket_name" {
  description = "The name of the S3 bucket."
  type        = string
}



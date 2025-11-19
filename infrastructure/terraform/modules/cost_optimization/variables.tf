
variable "launch_configuration_name" {
  description = "The name of the launch configuration to use for the ASG."
  type        = string
}

variable "asg_min_size" {
  description = "The minimum size of the Auto Scaling Group."
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "The maximum size of the Auto Scaling Group."
  type        = number
  default     = 3
}

variable "subnet_ids" {
  description = "A list of subnet IDs to launch resources in."
  type        = list(string)
}

variable "project_name" {
  description = "The name of the project."
  type        = string
}

variable "s3_bucket_id" {
  description = "The ID of the S3 bucket for lifecycle policies."
  type        = string
}

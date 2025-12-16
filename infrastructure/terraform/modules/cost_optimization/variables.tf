variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "autoscaling_group_name" {
  description = "Name of the existing Auto Scaling group"
  type        = string
}

variable "s3_bucket_id" {
  description = "ID of the S3 bucket for lifecycle rules"
  type        = string
}

variable "scaling_adjustment" {
  description = "Number of instances to scale up/down"
  type        = number
  default     = 1
}

variable "scaling_cooldown" {
  description = "Cooldown period between scaling actions in seconds"
  type        = number
  default     = 300
}

variable "cpu_threshold" {
  description = "CPU utilization threshold for scale-up"
  type        = number
  default     = 70
}

variable "cpu_low_threshold" {
  description = "CPU utilization threshold for scale-down"
  type        = number
  default     = 30
}

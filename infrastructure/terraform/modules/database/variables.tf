variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "db_allocated_storage" {
  description = "The allocated storage in GBs."
  type        = number
  default     = 20
}

variable "db_engine" {
  description = "The database engine to use."
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "The database engine version."
  type        = string
  default     = "8.0.28"
}

variable "db_instance_class" {
  description = "The instance type of the database."
  type        = string
  default     = "db.t3.medium"
}

variable "db_name" {
  description = "The name of the database."
  type        = string
  default     = "lendsmartdb"
}

variable "db_username" {
  description = "The master username for the database."
  type        = string
}

variable "db_password" {
  description = "The master password for the database."
  type        = string
  sensitive   = true
}

variable "db_parameter_group_name" {
  description = "The name of the DB parameter group to associate."
  type        = string
  default     = "default.mysql8.0"
}

variable "db_skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted."
  type        = bool
  default     = true
}

variable "db_subnet_group_name" {
  description = "The name of the DB subnet group to associate."
  type        = string
}

variable "db_security_group_ids" {
  description = "A list of VPC security group IDs to associate with the DB instance."
  type        = list(string)
}

variable "db_kms_key_id" {
  description = "The ARN of the KMS key for encryption at rest."
  type        = string
  default     = null
}

variable "db_backup_retention_period" {
  description = "The number of days to retain backups."
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created."
  type        = string
  default     = "03:00-04:00"
}

variable "db_multi_az" {
  description = "A boolean indicating whether the DB instance is Multi-AZ."
  type        = bool
  default     = false
}



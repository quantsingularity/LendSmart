resource "aws_db_instance" "lend_smart_db" {
  allocated_storage    = var.db_allocated_storage
  engine               = var.db_engine
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  name                 = var.db_name
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = var.db_parameter_group_name
  skip_final_snapshot  = var.db_skip_final_snapshot
  db_subnet_group_name = var.db_subnet_group_name
  vpc_security_group_ids = var.db_security_group_ids

  # Encryption at rest
  storage_encrypted    = true
  kms_key_id           = var.db_kms_key_id

  # Backup configuration
  backup_retention_period = var.db_backup_retention_period
  backup_window           = var.db_backup_window
  multi_az                = var.db_multi_az

  tags = {
    Name = "lend-smart-db"
  }
}



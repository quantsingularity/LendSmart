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

  # Performance Insights
  performance_insights_enabled = var.db_performance_insights_enabled
  performance_insights_retention_period = var.db_performance_insights_retention_period
  performance_insights_kms_key_id = var.db_performance_insights_kms_key_id

  tags = {
    Name = "lend-smart-db"
  }
}

resource "aws_rds_cluster" "lend_smart_aurora_cluster" {
  cluster_identifier      = "lend-smart-aurora-cluster"
  engine                  = "aurora-mysql"
  engine_version          = "8.0.mysql_aurora.3.02.0"
  availability_zones      = var.aurora_availability_zones
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password
  backup_retention_period = var.db_backup_retention_period
  preferred_backup_window = var.db_backup_window
  vpc_security_group_ids  = var.db_security_group_ids
  db_subnet_group_name    = var.db_subnet_group_name
  storage_encrypted       = true
  kms_key_id              = var.db_kms_key_id
  skip_final_snapshot     = var.db_skip_final_snapshot

  tags = {
    Name = "lend-smart-aurora-cluster"
  }
}

resource "aws_rds_cluster_instance" "lend_smart_aurora_instance" {
  count              = var.aurora_instance_count
  cluster_identifier = aws_rds_cluster.lend_smart_aurora_cluster.id
  instance_class     = var.aurora_instance_class
  engine             = aws_rds_cluster.lend_smart_aurora_cluster.engine
  engine_version     = aws_rds_cluster.lend_smart_aurora_cluster.engine_version

  tags = {
    Name = "lend-smart-aurora-instance-${count.index}"
  }
}



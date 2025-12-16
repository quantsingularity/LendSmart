output "db_endpoint" {
  description = "Endpoint of the RDS database instance"
  value       = aws_db_instance.lend_smart_db.endpoint
}

output "db_name" {
  description = "Name of the database"
  value       = aws_db_instance.lend_smart_db.db_name
}

output "db_username" {
  description = "Master username for the database"
  value       = aws_db_instance.lend_smart_db.username
  sensitive   = true
}

output "aurora_cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.lend_smart_aurora_cluster.endpoint
}

output "aurora_reader_endpoint" {
  description = "Reader endpoint for the Aurora cluster"
  value       = aws_rds_cluster.lend_smart_aurora_cluster.reader_endpoint
}

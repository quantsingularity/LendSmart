output "app_data_bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.app_data_bucket.id
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_data_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.app_data_bucket.arn
}

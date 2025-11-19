resource "aws_s3_bucket" "app_data_bucket" {
  bucket = var.bucket_name

  tags = {
    Name = "${var.bucket_name}-app-data"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data_bucket_encryption" {
  bucket = aws_s3_bucket.app_data_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "app_data_bucket_versioning" {
  bucket = aws_s3_bucket.app_data_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "app_data_bucket_public_access_block" {
  bucket = aws_s3_bucket.app_data_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

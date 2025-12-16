# Application Security Group
resource "aws_security_group" "app" {
  name        = "${var.app_name}-${var.environment}-app-sg"
  description = "Security group for application servers"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-app-sg"
    Environment = var.environment
  }
}

# Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.app_name}-${var.environment}-db-sg"
  description = "Security group for database servers"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MySQL/Aurora from app servers only"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-${var.environment}-db-sg"
    Environment = var.environment
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "app_role" {
  name = "${var.app_name}-${var.environment}-app-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.app_name}-${var.environment}-app-role"
    Environment = var.environment
  }
}

# S3 Read-Only Policy (optional, only if s3_bucket_name is provided)
resource "aws_iam_policy" "s3_read_only" {
  count       = var.s3_bucket_name != "" ? 1 : 0
  name        = "${var.app_name}-${var.environment}-s3-read-policy"
  description = "Allows read-only access to specified S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::${var.s3_bucket_name}",
          "arn:aws:s3:::${var.s3_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "app_s3_read_only" {
  count      = var.s3_bucket_name != "" ? 1 : 0
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.s3_read_only[0].arn
}

# IAM Instance Profile for EC2
resource "aws_iam_instance_profile" "app" {
  name = "${var.app_name}-${var.environment}-instance-profile"
  role = aws_iam_role.app_role.name

  tags = {
    Name        = "${var.app_name}-${var.environment}-instance-profile"
    Environment = var.environment
  }
}

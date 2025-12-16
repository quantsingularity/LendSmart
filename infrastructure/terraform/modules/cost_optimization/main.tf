# Cost Optimization Module
# Adds scaling policies and lifecycle rules to existing resources

resource "aws_autoscaling_policy" "app_scaling_policy" {
  name                   = "${var.project_name}-app-scaling-policy"
  scaling_adjustment     = var.scaling_adjustment
  cooldown               = var.scaling_cooldown
  adjustment_type        = "ChangeInCapacity"
  autoscaling_group_name = var.autoscaling_group_name
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization_high" {
  alarm_name          = "${var.project_name}-cpu-utilization-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_threshold
  alarm_description   = "This alarm monitors EC2 CPU utilization for scaling"

  dimensions = {
    AutoScalingGroupName = var.autoscaling_group_name
  }

  alarm_actions = [aws_autoscaling_policy.app_scaling_policy.arn]
}

resource "aws_cloudwatch_metric_alarm" "cpu_utilization_low" {
  alarm_name          = "${var.project_name}-cpu-utilization-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = var.cpu_low_threshold
  alarm_description   = "This alarm monitors EC2 CPU utilization for scale-down"

  dimensions = {
    AutoScalingGroupName = var.autoscaling_group_name
  }

  alarm_actions = [aws_autoscaling_policy.app_scaling_policy.arn]
}

resource "aws_s3_bucket_lifecycle_configuration" "app_data_bucket_lifecycle" {
  bucket = var.s3_bucket_id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    expiration {
      days = 365
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }
  }
}

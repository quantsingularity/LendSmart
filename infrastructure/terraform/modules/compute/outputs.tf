output "instance_ids" {
  description = "IDs of the EC2 instances"
  value       = aws_autoscaling_group.app.id
}

output "instance_public_ips" {
  description = "Public IPs of the EC2 instances"
  value       = aws_lb.app.dns_name
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.app.dns_name
}

output "autoscaling_group_name" {
  description = "Name of the Auto Scaling group"
  value       = aws_autoscaling_group.app.name
}

output "launch_template_id" {
  description = "ID of the launch template"
  value       = aws_launch_template.app.id
}

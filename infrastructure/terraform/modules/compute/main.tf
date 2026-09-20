# -----------------------------------------------------------------------------
# Compute module
#
# ALB + Auto Scaling Group running the Node.js API, plus the CodeDeploy
# application that ships new revisions to it. Matches "EC2A / EC2B / ASG"
# in the Cloud Architecture diagram.
#
# One deliberate, slightly non-obvious piece: CloudFront talks to the ALB
# over HTTPS with certificate validation (Section 9.1.12's protocol table
# says so explicitly), but you cannot get a public ACM certificate for an
# AWS-owned *.elb.amazonaws.com hostname. So the ALB gets its own small
# subdomain — origin.<domain> — with a real regional ACM certificate, and
# CloudFront is pointed at that hostname rather than at the raw ALB DNS
# name. This is the standard AWS pattern for CloudFront-to-ALB HTTPS; it's
# worth being able to explain in the architecture defence, since it isn't
# obvious from the diagram alone.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  type = list(string)
}

variable "app_subnet_ids" {
  type = list(string)
}

variable "alb_security_group_id" {
  type = string
}

variable "app_security_group_id" {
  type = string
}

variable "ec2_instance_profile_name" {
  type = string
}

variable "codedeploy_service_role_arn" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "asg_min_size" {
  type = number
}

variable "asg_max_size" {
  type = number
}

variable "asg_desired_capacity" {
  type = number
}

variable "app_port" {
  type = number
}

variable "route53_zone_id" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "db_endpoint" {
  type = string
}

variable "db_credentials_secret_arn" {
  type = string
}

variable "jwt_secret_arn" {
  type = string
}

variable "uploads_bucket_name" {
  type = string
}

locals {
  name          = "${var.project_name}-${var.environment}"
  origin_domain = "origin.${var.domain_name}"
  # DB endpoint from RDS comes as "host:port" — the app wants just the host.
  db_host = split(":", var.db_endpoint)[0]
  db_name = "silas_mobiles"
}

# =============================================================================
# ALB origin certificate — regional, DNS-validated via the shared zone
# =============================================================================

resource "aws_acm_certificate" "origin" {
  domain_name       = local.origin_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "origin_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.origin.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = var.route53_zone_id
  name             = each.value.name
  type              = each.value.type
  ttl                = 300
  records             = [each.value.record]
  allow_overwrite       = true
}

resource "aws_acm_certificate_validation" "origin" {
  certificate_arn         = aws_acm_certificate.origin.arn
  validation_record_fqdns   = [for r in aws_route53_record.origin_cert_validation : r.fqdn]
}

# =============================================================================
# Application Load Balancer
# =============================================================================

resource "aws_lb" "app" {
  name               = local.name
  internal            = false
  load_balancer_type    = "application"
  security_groups         = [var.alb_security_group_id]
  subnets                   = var.public_subnet_ids

  enable_deletion_protection = var.environment == "production"

  tags = { Name = local.name }
}

resource "aws_lb_target_group" "app" {
  name     = local.name
  port      = var.app_port
  protocol   = "HTTP"
  vpc_id      = var.vpc_id
  target_type   = "instance"

  health_check {
    path                 = "/health"
    matcher                = "200"
    interval                 = 30
    timeout                    = 5
    healthy_threshold             = 2
    unhealthy_threshold             = 3
  }

  # Give in-flight requests time to finish before an instance is deregistered
  # during a CodeDeploy rolling deployment.
  deregistration_delay = 30

  tags = { Name = local.name }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port                = 443
  protocol             = "HTTPS"
  ssl_policy             = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn          = aws_acm_certificate_validation.origin.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn   = aws_lb_target_group.app.arn
  }
}

resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.app.arn
  port                = 80
  protocol             = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port         = "443"
      protocol       = "HTTPS"
      status_code      = "HTTP_301"
    }
  }
}

resource "aws_route53_record" "origin" {
  zone_id = var.route53_zone_id
  name    = local.origin_domain
  type    = "A"

  alias {
    name                   = aws_lb.app.dns_name
    zone_id                  = aws_lb.app.zone_id
    evaluate_target_health      = true
  }
}

# =============================================================================
# CloudWatch log group — created here, not in the monitoring module, because
# the EC2 instances (this module) are what write to it via user-data; the
# monitoring module only reads its name back for optional log-based alarms.
# =============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/${var.project_name}/${var.environment}/app"
  retention_in_days = var.environment == "production" ? 90 : 30
}

# =============================================================================
# Launch template + Auto Scaling Group
# =============================================================================

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name}-"
  image_id       = data.aws_ami.ubuntu.id
  instance_type    = var.instance_type

  iam_instance_profile {
    name = var.ec2_instance_profile_name
  }

  vpc_security_group_ids = [var.app_security_group_id]

  metadata_options {
    http_tokens   = "required" # IMDSv2 only
    http_endpoint    = "enabled"
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size = 20
      volume_type = "gp3"
      encrypted   = true
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh.tpl", {
    node_major                 = "24"
    aws_region                  = var.aws_region
    app_port                     = var.app_port
    db_host                        = local.db_host
    db_name                          = local.db_name
    db_credentials_secret_arn          = var.db_credentials_secret_arn
    jwt_secret_arn                        = var.jwt_secret_arn
    uploads_bucket                          = var.uploads_bucket_name
    log_group_name                             = aws_cloudwatch_log_group.app.name
  }))

  tag_specifications {
    resource_type = "instance"
    tags          = { Name = "${local.name}-app" }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "app" {
  name                        = local.name
  vpc_zone_identifier              = var.app_subnet_ids
  target_group_arns                  = [aws_lb_target_group.app.arn]
  health_check_type                     = "ELB"
  health_check_grace_period                = 300

  min_size          = var.asg_min_size
  max_size            = var.asg_max_size
  desired_capacity      = var.asg_desired_capacity

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  # CodeDeploy owns instance lifecycle during a deployment (draining,
  # re-registering) — let it finish before the ASG's own health check
  # decides a freshly-deployed instance is unhealthy and cycles it.
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${local.name}-app"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                    = "${local.name}-cpu-target-tracking"
  autoscaling_group_name    = aws_autoscaling_group.app.name
  policy_type                 = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 60
  }
}

# =============================================================================
# CodeDeploy — in-place, rolling, one instance at a time, traffic-controlled
# =============================================================================

resource "aws_codedeploy_app" "backend" {
  name             = local.name
  compute_platform = "Server"
}

resource "aws_codedeploy_deployment_group" "backend" {
  app_name               = aws_codedeploy_app.backend.name
  deployment_group_name    = "${local.name}-dg"
  service_role_arn           = var.codedeploy_service_role_arn

  autoscaling_groups = [aws_autoscaling_group.app.name]

  deployment_style {
    deployment_type   = "IN_PLACE"
    deployment_option = "WITH_TRAFFIC_CONTROL"
  }

  deployment_config_name = "CodeDeployDefault.OneAtATime"

  load_balancer_info {
    target_group_info {
      name = aws_lb_target_group.app.name
    }
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE"]
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "alb_dns_name" {
  value = aws_lb.app.dns_name
}

output "alb_arn_suffix" {
  value = aws_lb.app.arn_suffix
}

output "target_group_arn_suffix" {
  value = aws_lb_target_group.app.arn_suffix
}

output "origin_domain_name" {
  description = "What CloudFront's origin block points at — not the raw ALB DNS name, see module comment."
  value       = local.origin_domain
}

output "asg_name" {
  value = aws_autoscaling_group.app.name
}

output "codedeploy_application_name" {
  value = aws_codedeploy_app.backend.name
}

output "codedeploy_deployment_group_name" {
  value = aws_codedeploy_deployment_group.backend.deployment_group_name
}

output "cloudwatch_log_group_name" {
  value = aws_cloudwatch_log_group.app.name
}

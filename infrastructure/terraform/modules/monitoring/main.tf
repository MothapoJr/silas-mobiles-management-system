# -----------------------------------------------------------------------------
# Monitoring module — SNS alarm topic + a deliberately small set of
# high-signal CloudWatch alarms (CPU, RDS storage, ALB 5xx rate). Aimed at
# "notice a real problem fast," not "alert on everything" — a WIL team of
# four does not want three pages a day from a low-value threshold.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "asg_name" {
  type = string
}

variable "db_instance_id" {
  type = string
}

variable "alb_arn_suffix" {
  type = string
}

variable "target_group_arn_suffix" {
  type = string
}

variable "alert_email" {
  type = string
}

locals {
  name = "${var.project_name}-${var.environment}"
}

resource "aws_sns_topic" "alarms" {
  name = "${local.name}-alarms"
}

# SNS emails a confirmation link to alert_email once — it has to be clicked
# before any alarm actually delivers. There's no way to skip that step for
# an email subscription; it's an SNS safeguard, not a Terraform limitation.
resource "aws_sns_topic_subscription" "alarms_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "ec2_high_cpu" {
  alarm_name          = "${local.name}-ec2-high-cpu"
  comparison_operator    = "GreaterThanThreshold"
  evaluation_periods       = 2
  metric_name                 = "CPUUtilization"
  namespace                      = "AWS/EC2"
  period                            = 300
  statistic                            = "Average"
  threshold                               = 80
  alarm_description                          = "App tier CPU above 80% for 10 minutes — the target-tracking policy should already be scaling out; this alarm is the backstop in case it can't (e.g. ASG at max_size)."
  alarm_actions                                 = [aws_sns_topic.alarms.arn]
  ok_actions                                       = [aws_sns_topic.alarms.arn]

  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_low_storage" {
  alarm_name          = "${local.name}-rds-low-storage"
  comparison_operator    = "LessThanThreshold"
  evaluation_periods       = 1
  metric_name                 = "FreeStorageSpace"
  namespace                      = "AWS/RDS"
  period                            = 300
  statistic                            = "Average"
  threshold                               = 2147483648 # 2 GiB, in bytes
  alarm_description                          = "RDS free storage below 2 GiB — act before autoscaling storage kicks in or writes start failing."
  alarm_actions                                 = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_high_cpu" {
  alarm_name          = "${local.name}-rds-high-cpu"
  comparison_operator    = "GreaterThanThreshold"
  evaluation_periods       = 3
  metric_name                 = "CPUUtilization"
  namespace                      = "AWS/RDS"
  period                            = 300
  statistic                            = "Average"
  threshold                               = 80
  alarm_description                          = "RDS CPU above 80% for 15 minutes."
  alarm_actions                                 = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${local.name}-alb-5xx"
  comparison_operator    = "GreaterThanThreshold"
  evaluation_periods       = 2
  metric_name                 = "HTTPCode_Target_5XX_Count"
  namespace                      = "AWS/ApplicationELB"
  period                            = 300
  statistic                            = "Sum"
  threshold                               = 10
  alarm_description                          = "More than 10 backend 5xx responses in 5 minutes — likely an application or database problem, not just load."
  alarm_actions                                 = [aws_sns_topic.alarms.arn]
  treat_missing_data                               = "notBreaching"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
    TargetGroup  = var.target_group_arn_suffix
  }
}

output "sns_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

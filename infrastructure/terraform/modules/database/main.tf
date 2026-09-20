# -----------------------------------------------------------------------------
# Database module
#
# RDS PostgreSQL, sized and Multi-AZ'd per environment via the root
# variables (see environments/*.tfvars). Password comes from the secret
# the security module already created — this module only *reads* it via a
# data source, it never generates or stores credentials itself, so there is
# exactly one place (security/main.tf) where the master password originates.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "data_subnet_ids" {
  type = list(string)
}

variable "db_security_group_id" {
  type = string
}

variable "db_instance_class" {
  type = string
}

variable "multi_az" {
  type = bool
}

variable "allocated_storage" {
  type = number
}

variable "db_name" {
  type = string
}

variable "db_master_username" {
  type = string
}

variable "db_credentials_secret_arn" {
  type = string
}

locals {
  name = "${var.project_name}-${var.environment}"
}

data "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = var.db_credentials_secret_arn
}

locals {
  db_credentials = jsondecode(data.aws_secretsmanager_secret_version.db_credentials.secret_string)
}

resource "aws_db_subnet_group" "main" {
  name       = local.name
  subnet_ids = var.data_subnet_ids
  tags       = { Name = local.name }
}

resource "aws_db_parameter_group" "main" {
  name   = local.name
  family = "postgres15"

  parameter {
    name  = "log_min_duration_statement"
    value = "1000" # log queries slower than 1s — cheap early warning for the Performance NFR (3s page / 500ms API)
  }
}

resource "aws_db_instance" "main" {
  identifier     = local.name
  engine          = "postgres"
  engine_version   = "15"
  instance_class    = var.db_instance_class

  allocated_storage     = var.allocated_storage
  storage_type            = "gp3"
  storage_encrypted         = true

  db_name  = var.db_name
  username = local.db_credentials.username
  password = local.db_credentials.password
  port     = 5432

  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids    = [var.db_security_group_id]
  parameter_group_name        = aws_db_parameter_group.main.name

  multi_az = var.multi_az

  backup_retention_period = var.environment == "production" ? 14 : 7
  backup_window             = "01:00-02:00"   # 03:00-04:00 SAST — low traffic
  maintenance_window          = "sun:02:00-sun:03:00"

  deletion_protection        = var.environment == "production"
  skip_final_snapshot           = var.environment != "production"
  final_snapshot_identifier      = var.environment == "production" ? "${local.name}-final" : null

  performance_insights_enabled = true
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  auto_minor_version_upgrade = true
  apply_immediately             = var.environment != "production"

  tags = { Name = local.name }
}

# --- Outputs ---------------------------------------------------------------

output "db_endpoint" {
  description = "Host:port. The app splits this itself — see backend/src/config/database.js."
  value       = aws_db_instance.main.endpoint
}

output "db_address" {
  value = aws_db_instance.main.address
}

output "db_instance_id" {
  value = aws_db_instance.main.id
}

# -----------------------------------------------------------------------------
# Security module
#
# Everything access-control-related in one place: the three tier security
# groups, GuardDuty, the two Secrets Manager secrets, the EC2 instance role,
# the CodeDeploy service role, and the GitHub Actions OIDC deploy role.
# Grouped together deliberately — it mirrors the "SVC" cluster of the Cloud
# Architecture diagram and keeps every least-privilege decision reviewable
# in one file for the Task 2 architecture defence.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "db_master_username" {
  type = string
}

variable "github_org" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "deploy_artifacts_bucket_arn" {
  type = string
}

variable "uploads_bucket_arn" {
  type = string
}

variable "static_bucket_arn" {
  type = string
}

locals {
  name = "${var.project_name}-${var.environment}"
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# =============================================================================
# Security groups
# =============================================================================

# CloudFront's managed prefix list — restricts the ALB to only accept
# traffic that has actually come through CloudFront/WAF, not direct hits
# on the ALB's public DNS name. This is what makes "no application or
# database servers are directly accessible from the internet" (Section
# 9.1.12) literally true for the ALB, not just true in the diagram.
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Public-facing ALB — only reachable from CloudFront"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from CloudFront only"
    from_port       = 443
    to_port          = 443
    protocol          = "tcp"
    prefix_list_ids    = [data.aws_ec2_managed_prefix_list.cloudfront.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-alb" }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "EC2 app tier — only reachable from the ALB"
  vpc_id      = var.vpc_id

  ingress {
    description     = "App port from ALB only"
    from_port       = 3000
    to_port          = 3000
    protocol          = "tcp"
    security_groups    = [aws_security_group.alb.id]
  }

  egress {
    description = "Outbound via NAT Gateway — RDS, S3, SES, Secrets Manager, npm during deploys"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name}-app" }
}

resource "aws_security_group" "db" {
  name        = "${local.name}-db"
  description = "RDS PostgreSQL — only reachable from the app tier, port 5432 only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from app tier only"
    from_port       = 5432
    to_port          = 5432
    protocol          = "tcp"
    security_groups    = [aws_security_group.app.id]
  }

  # No egress rule needed — RDS does not initiate outbound connections.
  # (The provider still requires the block to be present to mean "no
  # egress"; omitting it entirely defaults to allow-all, which is not
  # what we want here.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = { Name = "${local.name}-db" }
}

# =============================================================================
# GuardDuty
# =============================================================================

# One detector per account per region — if GuardDuty is already enabled in
# this account/region (e.g. via AWS Organizations delegated administration),
# remove this resource and reference the existing detector with a data
# source instead; a second detector resource here will fail to apply.
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "FIFTEEN_MINUTES"
}

# =============================================================================
# Secrets Manager
#
# Only the password is generated and stored as a secret. The database
# hostname is not sensitive and is passed to the app as a plain environment
# variable by the compute module's user-data — see that module's comments
# for why splitting it this way avoids a circular dependency between the
# database and the secret that has to exist before the database does.
# =============================================================================

resource "random_password" "db" {
  length  = 32
  special = true
  # Excludes characters RDS rejects in a master password: '/', '@', '"', ' '.
  override_special = "!#$%^&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${local.name}/db-credentials"
  description = "RDS PostgreSQL master credentials for the Silas Mobiles Management System (${var.environment})"
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_master_username
    password = random_password.db.result
  })
}

resource "random_password" "jwt_access" {
  length  = 64
  special = false
}

resource "random_password" "jwt_refresh" {
  length  = 64
  special = false
}

resource "aws_secretsmanager_secret" "jwt" {
  name        = "${local.name}/jwt-secrets"
  description = "JWT signing secrets — 15-minute access token + refresh token, per Section 9.1.13"
}

resource "aws_secretsmanager_secret_version" "jwt" {
  secret_id = aws_secretsmanager_secret.jwt.id
  secret_string = jsonencode({
    access_token_secret  = random_password.jwt_access.result
    refresh_token_secret = random_password.jwt_refresh.result
  })
}

# =============================================================================
# IAM — EC2 instance role
#
# Session Manager (SSM) is granted instead of opening an SSH security-group
# rule, so there is no port 22 exposed anywhere and no key pair to lose —
# access is via `aws ssm start-session`, gated entirely by IAM.
# =============================================================================

data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2_app" {
  name               = "${local.name}-ec2-app"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.ec2_app.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

data "aws_iam_policy_document" "ec2_app_inline" {
  statement {
    sid       = "ReadAppSecrets"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.db_credentials.arn, aws_secretsmanager_secret.jwt.arn]
  }

  statement {
    sid       = "UploadsBucketReadWrite"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.uploads_bucket_arn}/*"]
  }

  statement {
    sid       = "UploadsBucketList"
    actions   = ["s3:ListBucket"]
    resources = [var.uploads_bucket_arn]
  }

  statement {
    sid       = "DeployArtifactsRead"
    actions   = ["s3:GetObject"]
    resources = ["${var.deploy_artifacts_bucket_arn}/*"]
  }

  statement {
    sid       = "SendTransactionalEmail"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "ec2_app_inline" {
  name   = "${local.name}-ec2-app-inline"
  role   = aws_iam_role.ec2_app.id
  policy = data.aws_iam_policy_document.ec2_app_inline.json
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "${local.name}-ec2-app"
  role = aws_iam_role.ec2_app.name
}

# =============================================================================
# IAM — CodeDeploy service role
# =============================================================================

data "aws_iam_policy_document" "codedeploy_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codedeploy.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "codedeploy" {
  name               = "${local.name}-codedeploy"
  assume_role_policy = data.aws_iam_policy_document.codedeploy_assume.json
}

resource "aws_iam_role_policy_attachment" "codedeploy" {
  role       = aws_iam_role.codedeploy.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole"
}

# =============================================================================
# GitHub Actions OIDC — no long-lived AWS keys stored in GitHub secrets
# =============================================================================

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  # GitHub's OIDC intermediate has rotated before; AWS now validates OIDC
  # providers against its own trusted CA store for most well-known issuers,
  # but the argument is still required. Confirm the current thumbprint at
  # https://github.blog (search "OIDC thumbprint") before `terraform apply`
  # if this is your first time creating this resource.
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea"]
}

data "aws_iam_policy_document" "github_actions_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Scoped to this repo's `staging` and `production` GitHub Environments
    # specifically — a workflow run against any other branch or repo cannot
    # assume this role, even with a stolen workflow file.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_org}/${var.github_repo}:environment:staging",
        "repo:${var.github_org}/${var.github_repo}:environment:production",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${local.name}-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume.json
  max_session_duration = 1800
}

data "aws_iam_policy_document" "github_actions_inline" {
  statement {
    sid     = "CodeDeployTrigger"
    actions = [
      "codedeploy:CreateDeployment",
      "codedeploy:GetDeployment",
      "codedeploy:GetDeploymentConfig",
      "codedeploy:GetApplicationRevision",
      "codedeploy:RegisterApplicationRevision",
    ]
    resources = [
      "arn:aws:codedeploy:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:application:${local.name}",
      "arn:aws:codedeploy:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:deploymentgroup:${local.name}/*",
      "arn:aws:codedeploy:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:deploymentconfig:*",
    ]
  }

  statement {
    sid       = "UploadBackendRevision"
    actions   = ["s3:PutObject", "s3:GetObject"]
    resources = ["${var.deploy_artifacts_bucket_arn}/*"]
  }

  statement {
    sid       = "SyncFrontendBuild"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [var.static_bucket_arn, "${var.static_bucket_arn}/*"]
  }

  statement {
    sid       = "InvalidateCloudFront"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions_inline" {
  name   = "${local.name}-github-actions-inline"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_inline.json
}

# =============================================================================
# Outputs
# =============================================================================

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}

output "db_security_group_id" {
  value = aws_security_group.db.id
}

output "ec2_instance_profile_name" {
  value = aws_iam_instance_profile.ec2_app.name
}

output "codedeploy_service_role_arn" {
  value = aws_iam_role.codedeploy.arn
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "db_credentials_secret_arn" {
  value = aws_secretsmanager_secret.db_credentials.arn
}

output "jwt_secret_arn" {
  value = aws_secretsmanager_secret.jwt.arn
}

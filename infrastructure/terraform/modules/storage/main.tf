# -----------------------------------------------------------------------------
# Storage module
#
# Three buckets, all private (no public access — CloudFront reaches the
# static bucket via Origin Access Control, set up in the cdn module once
# the distribution exists; the bucket *policy* granting that access lives
# there too, to avoid a circular dependency between this module and cdn).
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

locals {
  name = "${var.project_name}-${var.environment}"
}

data "aws_caller_identity" "current" {}

# --- Static assets (React build, served via CloudFront) -----------------------

resource "aws_s3_bucket" "static" {
  bucket = "${local.name}-static-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket                  = aws_s3_bucket.static.id
  block_public_acls         = true
  block_public_policy        = true
  ignore_public_acls          = true
  restrict_public_buckets       = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "static" {
  bucket = aws_s3_bucket.static.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

# --- User uploads (booking photos, issue reports — accessed via signed URLs) --

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name}-uploads-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls         = true
  block_public_policy        = true
  ignore_public_acls          = true
  restrict_public_buckets       = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  cors_rule {
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins  = ["https://${local.name}.co.za", "https://*.silasmobiles.co.za"]
    allowed_headers   = ["*"]
    max_age_seconds     = 3000
  }
}

# --- CodeDeploy revisions (backend zip bundles uploaded by GitHub Actions) -----

resource "aws_s3_bucket" "deploy_artifacts" {
  bucket = "${local.name}-deploy-artifacts-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_public_access_block" "deploy_artifacts" {
  bucket                  = aws_s3_bucket.deploy_artifacts.id
  block_public_acls         = true
  block_public_policy        = true
  ignore_public_acls          = true
  restrict_public_buckets       = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "deploy_artifacts" {
  bucket = aws_s3_bucket.deploy_artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Old revisions pile up fast (one per deploy) and have no long-term value —
# expire them after 30 days to keep the bucket from growing forever.
resource "aws_s3_bucket_lifecycle_configuration" "deploy_artifacts" {
  bucket = aws_s3_bucket.deploy_artifacts.id
  rule {
    id     = "expire-old-revisions"
    status = "Enabled"
    filter {}
    expiration {
      days = 30
    }
  }
}

# --- Outputs ---------------------------------------------------------------

output "static_bucket_name" {
  value = aws_s3_bucket.static.id
}

output "static_bucket_arn" {
  value = aws_s3_bucket.static.arn
}

output "static_bucket_regional_domain_name" {
  value = aws_s3_bucket.static.bucket_regional_domain_name
}

output "uploads_bucket_name" {
  value = aws_s3_bucket.uploads.id
}

output "uploads_bucket_arn" {
  value = aws_s3_bucket.uploads.arn
}

output "deploy_artifacts_bucket_name" {
  value = aws_s3_bucket.deploy_artifacts.id
}

output "deploy_artifacts_bucket_arn" {
  value = aws_s3_bucket.deploy_artifacts.arn
}

# -----------------------------------------------------------------------------
# Remote state
#
# Deliberately left partial: bucket/key/region are supplied per-environment
# with `-backend-config=environments/<env>.backend.hcl` at `terraform init`
# time, so the same configuration deploys both staging and production into
# separate state files. See infrastructure/terraform/README.md for the
# one-time bootstrap commands (there is no bootstrap .tf — the state bucket
# has to exist before this backend can use it, so it's created imperatively
# once, not managed by the Terraform it stores state for).
#
# Locking uses Terraform's native S3 lock file (`use_lockfile`), not a
# DynamoDB table — this has been the recommended approach since Terraform
# 1.10 and removes a whole extra resource to provision and pay for.
# -----------------------------------------------------------------------------

terraform {
  backend "s3" {
    use_lockfile = true
    encrypt      = true
  }
}

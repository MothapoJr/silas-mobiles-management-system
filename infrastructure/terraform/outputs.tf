# -----------------------------------------------------------------------------
# Root outputs
#
# After `terraform apply`, copy the values this prints into the matching
# GitHub Environment's variables (Settings > Environments > staging/production
# > Variables) — the cd.yml workflow reads them from there. See
# infrastructure/terraform/README.md for the exact mapping.
# -----------------------------------------------------------------------------

output "route53_name_servers" {
  description = "Delegate your domain to these at your registrar (silasmobiles.co.za's DNS provider) so the hosted zone actually resolves."
  value       = aws_route53_zone.primary.name_servers
}

output "cloudfront_domain_name" {
  value = module.cdn.cloudfront_domain_name
}

output "cloudfront_distribution_id" {
  description = "-> GitHub Environment variable CLOUDFRONT_DISTRIBUTION_ID"
  value       = module.cdn.cloudfront_distribution_id
}

output "alb_dns_name" {
  value = module.compute.alb_dns_name
}

output "static_bucket_name" {
  description = "-> GitHub Environment variable STATIC_BUCKET"
  value       = module.storage.static_bucket_name
}

output "deploy_artifacts_bucket_name" {
  description = "-> GitHub Environment variable DEPLOY_ARTIFACTS_BUCKET"
  value       = module.storage.deploy_artifacts_bucket_name
}

output "github_actions_role_arn" {
  description = "-> GitHub Environment variable AWS_DEPLOY_ROLE_ARN"
  value       = module.security.github_actions_role_arn
}

output "codedeploy_application_name" {
  value = module.compute.codedeploy_application_name
}

output "codedeploy_deployment_group_name" {
  value = module.compute.codedeploy_deployment_group_name
}

output "db_endpoint" {
  value = module.database.db_endpoint
}

output "db_credentials_secret_arn" {
  description = "Fetch this at runtime with GetSecretValue — never put the password itself in an output or in state review."
  value       = module.security.db_credentials_secret_arn
}

output "jwt_secret_arn" {
  value = module.security.jwt_secret_arn
}

output "uploads_bucket_name" {
  value = module.storage.uploads_bucket_name
}

output "cloudwatch_log_group_name" {
  value = module.compute.cloudwatch_log_group_name
}

output "sns_alarm_topic_arn" {
  value = module.monitoring.sns_topic_arn
}

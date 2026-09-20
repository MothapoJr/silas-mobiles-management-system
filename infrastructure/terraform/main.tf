# -----------------------------------------------------------------------------
# Root module — wires the child modules together.
#
# Dependency order (Terraform resolves this automatically from the
# references below; noted here because it matters for the architecture
# defence): zone -> networking -> security -> {storage, database} ->
# compute -> {cdn, notifications} -> monitoring.
#
# The Route 53 zone is created here at root, not inside a module, because
# both the ALB's origin record (compute module) and the public CloudFront
# record (cdn module) need to write into the *same* hosted zone. Creating
# it inside either module would make that module depend on the other one
# owning DNS, which is a circular dependency in disguise.
# -----------------------------------------------------------------------------

resource "aws_route53_zone" "primary" {
  name    = var.domain_name
  comment = "Silas Mobiles Management System — ${var.environment}"
}

module "networking" {
  source = "./modules/networking"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

module "security" {
  source = "./modules/security"

  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.networking.vpc_id
  vpc_cidr            = var.vpc_cidr
  db_master_username   = var.db_master_username
  github_org           = var.github_org
  github_repo          = var.github_repo
  deploy_artifacts_bucket_arn = module.storage.deploy_artifacts_bucket_arn
  uploads_bucket_arn          = module.storage.uploads_bucket_arn
  static_bucket_arn           = module.storage.static_bucket_arn
}

module "storage" {
  source = "./modules/storage"

  project_name = var.project_name
  environment  = var.environment
}

module "database" {
  source = "./modules/database"

  project_name              = var.project_name
  environment                = var.environment
  data_subnet_ids            = module.networking.data_subnet_ids
  db_security_group_id       = module.security.db_security_group_id
  db_instance_class          = var.db_instance_class
  multi_az                   = var.db_multi_az
  allocated_storage          = var.db_allocated_storage
  db_name                    = var.db_name
  db_master_username         = var.db_master_username
  db_credentials_secret_arn  = module.security.db_credentials_secret_arn
}

module "compute" {
  source = "./modules/compute"

  project_name                 = var.project_name
  environment                   = var.environment
  aws_region                    = var.aws_region
  vpc_id                         = module.networking.vpc_id
  public_subnet_ids              = module.networking.public_subnet_ids
  app_subnet_ids                 = module.networking.app_subnet_ids
  alb_security_group_id          = module.security.alb_security_group_id
  app_security_group_id          = module.security.app_security_group_id
  ec2_instance_profile_name      = module.security.ec2_instance_profile_name
  codedeploy_service_role_arn    = module.security.codedeploy_service_role_arn
  instance_type                  = var.ec2_instance_type
  asg_min_size                   = var.asg_min_size
  asg_max_size                   = var.asg_max_size
  asg_desired_capacity           = var.asg_desired_capacity
  app_port                       = var.app_port
  route53_zone_id                = aws_route53_zone.primary.zone_id
  domain_name                    = var.domain_name
  db_endpoint                    = module.database.db_endpoint
  db_credentials_secret_arn      = module.security.db_credentials_secret_arn
  jwt_secret_arn                 = module.security.jwt_secret_arn
  uploads_bucket_name            = module.storage.uploads_bucket_name
}

module "cdn" {
  source = "./modules/cdn"

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }

  project_name                       = var.project_name
  environment                         = var.environment
  domain_name                         = var.domain_name
  route53_zone_id                     = aws_route53_zone.primary.zone_id
  origin_domain_name                  = module.compute.origin_domain_name
  static_bucket_name                  = module.storage.static_bucket_name
  static_bucket_arn                   = module.storage.static_bucket_arn
  static_bucket_regional_domain_name  = module.storage.static_bucket_regional_domain_name
}

module "notifications" {
  source = "./modules/notifications"

  domain_name     = var.domain_name
  route53_zone_id = aws_route53_zone.primary.zone_id
}

module "monitoring" {
  source = "./modules/monitoring"

  project_name          = var.project_name
  environment            = var.environment
  asg_name                = module.compute.asg_name
  db_instance_id           = module.database.db_instance_id
  alb_arn_suffix           = module.compute.alb_arn_suffix
  target_group_arn_suffix  = module.compute.target_group_arn_suffix
  alert_email              = var.alert_email
}

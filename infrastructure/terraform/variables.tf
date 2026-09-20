# -----------------------------------------------------------------------------
# Root variables
#
# Values that differ between staging and production live in
# environments/*.tfvars (sized directly off the Environments table in
# Section 9.1.10 of the Task 1 documentation). Values that never change
# between environments get a default here instead of being repeated in
# every .tfvars file.
# -----------------------------------------------------------------------------

variable "environment" {
  description = "Deployment environment name."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be \"staging\" or \"production\"."
  }
}

variable "aws_region" {
  description = "Primary AWS region. af-south-1 (Cape Town) is the only AWS region in South Africa and is required for POPIA Section 72 data-residency compliance — do not change this without re-checking that requirement."
  type        = string
  default     = "af-south-1"
}

variable "project_name" {
  type    = string
  default = "silas-mobiles"
}

variable "domain_name" {
  description = "Root domain for the system, e.g. silasmobiles.co.za. Must be a domain you control — Terraform creates a Route 53 hosted zone for it but does not register it or delegate NS records at your registrar; that step is manual (see README)."
  type        = string
}

# --- Networking --------------------------------------------------------------

variable "vpc_cidr" {
  type    = string
  default = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Exactly two AZs — enough for RDS Multi-AZ and an ALB across two zones without paying for a third NAT Gateway."
  type        = list(string)
  default     = ["af-south-1a", "af-south-1b"]
}

# --- Compute (sized per environment via environments/*.tfvars) ---------------

variable "ec2_instance_type" {
  description = "EC2 instance type for the app tier. staging = t3.small, production = t3.medium, per the Task 1 Deployment Plan."
  type        = string
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
  description = "Port the Express app listens on inside the instance."
  type        = number
  default     = 3000
}

# --- Database (sized per environment via environments/*.tfvars) --------------

variable "db_instance_class" {
  description = "RDS instance class. staging = db.t3.micro, production = db.t3.small, per the Task 1 Deployment Plan."
  type        = string
}

variable "db_multi_az" {
  description = "Whether RDS runs Multi-AZ. Only production needs this — staging stays single-AZ to keep cost down, matching the Task 1 Deployment Plan's staging/production split."
  type        = bool
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_name" {
  type    = string
  default = "silas_mobiles"
}

variable "db_master_username" {
  description = "RDS master username. Not treated as secret (usernames are guessable by design) — only the password is stored in Secrets Manager."
  type        = string
  default     = "silas_app"
}

# --- Notifications / alerting -------------------------------------------------

variable "ses_from_email" {
  description = "Verified sender address for booking notifications, e.g. bookings@silasmobiles.co.za. Must exist as a mailbox you can receive verification mail at, or be on a domain you control (SES verifies the whole domain via DNS — see README)."
  type        = string
}

variable "alert_email" {
  description = "Mailbox that receives CloudWatch alarm notifications. SNS will send a subscription-confirmation email here that has to be clicked once before alarms actually deliver."
  type        = string
}

# --- CI/CD ---------------------------------------------------------------------

variable "github_org" {
  description = "GitHub organisation or username that owns the repository, e.g. the-dev-masters."
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name, e.g. silas-mobiles-management-system."
  type        = string
}

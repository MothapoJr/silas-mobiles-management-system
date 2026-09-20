# -----------------------------------------------------------------------------
# Provider configuration
#
# Two aliases of the same provider are declared because CloudFront and its
# ACM certificate MUST live in us-east-1 regardless of which region the rest
# of the stack is deployed in — this is an AWS-wide constraint, not a choice.
# Everything else runs in af-south-1 (Cape Town) for POPIA data residency,
# per Section 9.1.12 of the Task 1 documentation.
# -----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "silas-mobiles-management-system"
      Environment = var.environment
      ManagedBy   = "terraform"
      Client      = "silas-mobiles"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "silas-mobiles-management-system"
      Environment = var.environment
      ManagedBy   = "terraform"
      Client      = "silas-mobiles"
    }
  }
}

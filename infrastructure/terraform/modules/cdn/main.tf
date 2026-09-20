# -----------------------------------------------------------------------------
# CDN module — the public entry point: Route 53 -> CloudFront -> WAF -> origin,
# exactly as drawn in the Cloud Architecture diagram (Section 9.1.12).
#
# Two origins on one distribution: the S3 static bucket serves the React
# build (default behaviour), and the ALB origin (from the compute module)
# serves /api/* (dynamic, not cached). The S3 bucket policy granting
# CloudFront's Origin Access Control read access lives here rather than in
# the storage module, because it needs the distribution's ARN, and putting
# it in storage would make storage depend on cdn depend on storage.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "domain_name" {
  type = string
}

variable "route53_zone_id" {
  type = string
}

variable "origin_domain_name" {
  description = "The ALB origin subdomain from the compute module (origin.<domain>), not the raw ALB DNS name — see that module's comment for why."
  type        = string
}

variable "static_bucket_name" {
  type = string
}

variable "static_bucket_arn" {
  type = string
}

variable "static_bucket_regional_domain_name" {
  type = string
}

locals {
  name = "${var.project_name}-${var.environment}"
  # Production gets the apex + www; staging gets its own subdomain only
  # (domain_name is already "staging.silasmobiles.co.za" for that tfvars file).
  aliases = var.environment == "production" ? [var.domain_name, "www.${var.domain_name}"] : [var.domain_name]
}

# =============================================================================
# Public certificate — CloudFront requires this in us-east-1 regardless of
# which region everything else runs in.
# =============================================================================

resource "aws_acm_certificate" "cdn" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  subject_alternative_names = var.environment == "production" ? ["www.${var.domain_name}"] : []
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cdn_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cdn.domain_validation_options : dvo.domain_name => {
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

resource "aws_acm_certificate_validation" "cdn" {
  provider                 = aws.us_east_1
  certificate_arn           = aws_acm_certificate.cdn.arn
  validation_record_fqdns     = [for r in aws_route53_record.cdn_cert_validation : r.fqdn]
}

# =============================================================================
# WAF — attached to CloudFront (must be created in us-east-1 for a
# CLOUDFRONT-scope WebACL, regardless of where CloudFront's traffic actually
# lands). Managed rule groups cover the general OWASP/XSS/SQLi surface;
# the rate-based rule is the concrete implementation of the "rate limiting"
# DDoS mitigation promised in the Security section's risk table.
# =============================================================================

resource "aws_wafv2_web_acl" "cdn" {
  provider    = aws.us_east_1
  name         = local.name
  description   = "Edge filtering for the Silas Mobiles Management System — XSS/SQLi managed rules + rate limiting"
  scope           = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                  = "${local.name}-common-rules"
      sampled_requests_enabled       = true
    }
  }

  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                  = "${local.name}-sqli-rules"
      sampled_requests_enabled       = true
    }
  }

  rule {
    name     = "RateLimitPerIP"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit                 = 2000
        aggregate_key_type      = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                  = "${local.name}-rate-limit"
      sampled_requests_enabled       = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                  = local.name
    sampled_requests_enabled       = true
  }
}

# =============================================================================
# CloudFront distribution
# =============================================================================

resource "aws_cloudfront_origin_access_control" "static" {
  name                              = local.name
  origin_access_control_origin_type  = "s3"
  signing_behavior                    = "always"
  signing_protocol                      = "sigv4"
}

resource "aws_cloudfront_distribution" "main" {
  enabled              = true
  is_ipv6_enabled          = true
  default_root_object         = "index.html"
  price_class                    = "PriceClass_200" # skip South America/Australia edge locations — not needed for a ZA-only client base
  aliases                           = local.aliases
  web_acl_id                          = aws_wafv2_web_acl.cdn.arn
  comment                                = local.name

  origin {
    origin_id                = "static-assets"
    domain_name                 = var.static_bucket_regional_domain_name
    origin_access_control_id      = aws_cloudfront_origin_access_control.static.id
  }

  origin {
    origin_id   = "api"
    domain_name    = var.origin_domain_name

    custom_origin_config {
      http_port                = 80
      https_port                  = 443
      origin_protocol_policy         = "https-only"
      origin_ssl_protocols               = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id           = "static-assets"
    viewer_protocol_policy        = "redirect-to-https"
    allowed_methods                  = ["GET", "HEAD", "OPTIONS"]
    cached_methods                     = ["GET", "HEAD"]
    compress                              = true
    cache_policy_id                          = "658327ea-f89d-4fab-a63d-7e88639e58f6" # AWS Managed-CachingOptimized
  }

  ordered_cache_behavior {
    path_pattern                = "/api/*"
    target_origin_id               = "api"
    viewer_protocol_policy            = "https-only"
    allowed_methods                      = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods                          = ["GET", "HEAD"]
    compress                                   = true
    cache_policy_id                               = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # AWS Managed-CachingDisabled
    origin_request_policy_id                         = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # AWS Managed-AllViewerExceptHostHeader
  }

  # SPA client-side routing: a deep link or a page refresh hits S3 for a path
  # that doesn't exist there and gets a 403 (S3) — send those to index.html
  # instead of showing an S3 XML error, and let React Router take it from there.
  custom_error_response {
    error_code            = 403
    response_code            = 200
    response_page_path          = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code            = 200
    response_page_path          = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.cdn.certificate_arn
    ssl_support_method          = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = { Name = local.name }
}

# S3 bucket policy granting only this specific distribution read access —
# created here (not in the storage module) because it needs the
# distribution's ARN.
data "aws_iam_policy_document" "static_oac" {
  statement {
    sid       = "AllowCloudFrontReadOnly"
    actions   = ["s3:GetObject"]
    resources = ["${var.static_bucket_arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.main.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "static_oac" {
  bucket = var.static_bucket_name
  policy = data.aws_iam_policy_document.static_oac.json
}

# =============================================================================
# DNS — apex/www (production) or subdomain (staging) alias to CloudFront
# =============================================================================

resource "aws_route53_record" "root" {
  for_each = toset(local.aliases)

  zone_id = var.route53_zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.main.domain_name
    zone_id                  = aws_cloudfront_distribution.main.hosted_zone_id
    evaluate_target_health      = false
  }
}

# =============================================================================
# Outputs
# =============================================================================

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.main.domain_name
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.main.id
}

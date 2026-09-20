# -----------------------------------------------------------------------------
# Notifications module — SES domain identity, DKIM and mail-from, for the
# booking-confirmation and alert emails described throughout Section 9.1.5's
# "Receive Notifications" requirements.
#
# Two things Terraform cannot do here, both manual, both noted in the
# infra README: (1) SES starts every new account in sandbox mode, able to
# send only to verified addresses — moving to production sending requires
# a one-time AWS Support request; (2) domain verification itself needs the
# TXT/CNAME records below to actually propagate, which happens automatically
# once the parent domain's NS records are delegated to this Route 53 zone.
# -----------------------------------------------------------------------------

variable "domain_name" {
  type = string
}

variable "route53_zone_id" {
  type = string
}

resource "aws_ses_domain_identity" "main" {
  domain = var.domain_name
}

resource "aws_route53_record" "ses_verification" {
  zone_id = var.route53_zone_id
  name    = "_amazonses.${var.domain_name}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.main.verification_token]
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

resource "aws_route53_record" "dkim" {
  count   = 3
  zone_id = var.route53_zone_id
  name    = "${aws_ses_domain_dkim.main.dkim_tokens[count.index]}._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.main.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

# Custom MAIL FROM domain — improves deliverability (aligns SPF with the
# visible From: domain) and keeps bounce/complaint notifications branded
# to silasmobiles.co.za instead of amazonses.com.
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.domain_name}"
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = var.route53_zone_id
  name    = aws_ses_domain_mail_from.main.mail_from_domain
  type    = "MX"
  ttl     = 600
  records = ["10 feedback-smtp.${data.aws_region.current.region}.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = var.route53_zone_id
  name    = aws_ses_domain_mail_from.main.mail_from_domain
  type    = "TXT"
  ttl     = 600
  records = ["v=spf1 include:amazonses.com ~all"]
}

data "aws_region" "current" {}

output "ses_domain_identity_arn" {
  value = aws_ses_domain_identity.main.arn
}

output "ses_verification_status" {
  description = "Check this after apply — SES verification can take a few minutes to propagate even once DNS is correct."
  value       = aws_ses_domain_identity.main.verification_token
}

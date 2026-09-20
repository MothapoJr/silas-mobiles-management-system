# -----------------------------------------------------------------------------
# Networking module
#
# Three-tier VPC across two AZs, matching the VPC subgraph in the Cloud
# Architecture diagram (Task 1 doc, Section 9.1.12):
#   Public subnets    -> ALB only, nothing else
#   App subnets        -> EC2 instances (private, outbound via NAT only)
#   Data subnets         -> RDS (private, no route to the internet at all)
#
# One NAT Gateway is shared by both AZs rather than one-per-AZ. That is a
# single point of failure for outbound calls (SES, S3, npm during deploys)
# if that AZ has an outage, but it halves the ~R650/month-per-NAT-Gateway
# cost, and it does not affect inbound availability — the ALB and the ASG
# are still spread across both AZs. Worth revisiting for production if the
# budget allows; documented here so it's a deliberate trade-off, not an
# oversight, when this comes up in the architecture defence.
# -----------------------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "availability_zones" {
  type = list(string)
}

locals {
  name = "${var.project_name}-${var.environment}"

  # /24s carved out of the /16: 10 public/app/data blocks per tier, two AZs
  # used per tier here, room to grow into a third AZ later without
  # re-numbering anything already in use.
  public_subnet_cidrs = [cidrsubnet(var.vpc_cidr, 8, 0), cidrsubnet(var.vpc_cidr, 8, 1)]
  app_subnet_cidrs    = [cidrsubnet(var.vpc_cidr, 8, 10), cidrsubnet(var.vpc_cidr, 8, 11)]
  data_subnet_cidrs   = [cidrsubnet(var.vpc_cidr, 8, 20), cidrsubnet(var.vpc_cidr, 8, 21)]
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = local.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = local.name }
}

# --- Public subnets (ALB) -----------------------------------------------------

resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${local.name}-public-${var.availability_zones[count.index]}", Tier = "public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-public" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id              = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# --- App subnets (EC2, private, NAT for outbound) ------------------------------

resource "aws_subnet" "app" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.app_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${local.name}-app-${var.availability_zones[count.index]}", Tier = "app" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${local.name}-nat" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  tags          = { Name = local.name }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "app" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-app" }
}

resource "aws_route" "app_nat" {
  route_table_id         = aws_route_table.app.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id          = aws_nat_gateway.main.id
}

resource "aws_route_table_association" "app" {
  count          = length(aws_subnet.app)
  subnet_id      = aws_subnet.app[count.index].id
  route_table_id = aws_route_table.app.id
}

# --- Data subnets (RDS, fully private — no route to the internet) -------------

resource "aws_subnet" "data" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.data_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${local.name}-data-${var.availability_zones[count.index]}", Tier = "data" }
}

resource "aws_route_table" "data" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name}-data" }
}

resource "aws_route_table_association" "data" {
  count          = length(aws_subnet.data)
  subnet_id      = aws_subnet.data[count.index].id
  route_table_id = aws_route_table.data.id
}

# --- Outputs -------------------------------------------------------------------

output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "app_subnet_ids" {
  value = aws_subnet.app[*].id
}

output "data_subnet_ids" {
  value = aws_subnet.data[*].id
}

# Production — matches the "Production" row of the Environments table in
# Section 9.1.10 of the Task 1 documentation: AWS EC2 (t3.medium),
# RDS (db.t3.small Multi-AZ). This is the tier the Running Costs section
# (9.1.15) prices at ~R4,000/month baseline.

environment = "production"
aws_region  = "af-south-1"

domain_name = "silasmobiles.co.za"

ec2_instance_type    = "t3.medium"
asg_min_size          = 2
asg_max_size           = 4
asg_desired_capacity   = 2

db_instance_class = "db.t3.small"
db_multi_az        = true

ses_from_email = "bookings@silasmobiles.co.za"
alert_email     = "silasndhlovu@gmail.com"

github_org  = "the-dev-masters"
github_repo = "silas-mobiles-management-system"

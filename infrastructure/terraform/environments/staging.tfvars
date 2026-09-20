# Staging — matches the "Staging" row of the Environments table in
# Section 9.1.10 of the Task 1 documentation: AWS EC2 (t3.small),
# RDS (db.t3.micro), single-AZ. Sized for integration testing, UAT and
# client preview, not for real traffic — kept small deliberately to
# control cost during the development period.

environment = "staging"
aws_region  = "af-south-1"

domain_name = "staging.silasmobiles.co.za"

ec2_instance_type    = "t3.small"
asg_min_size          = 1
asg_max_size           = 2
asg_desired_capacity   = 1

db_instance_class = "db.t3.micro"
db_multi_az        = false

ses_from_email = "bookings@silasmobiles.co.za"
alert_email     = "silasndhlovu@gmail.com"

github_org  = "the-dev-masters"
github_repo = "silas-mobiles-management-system"

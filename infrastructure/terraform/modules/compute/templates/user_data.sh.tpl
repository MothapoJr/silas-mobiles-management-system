#!/bin/bash
# Rendered by Terraform's templatefile() — every ${...} placeholder below is
# resolved to a real value at `terraform apply` time, before this script ever
# reaches the instance. The one exception is {instance_id} further down,
# which is the CloudWatch agent's own placeholder (no leading $), filled in
# by the agent itself at boot, not by Terraform.
set -euxo pipefail

exec > >(tee /var/log/silas-bootstrap.log) 2>&1
echo "Bootstrap started: $(date -u)"

# --- Base packages -----------------------------------------------------------
apt-get update -y
apt-get install -y curl unzip jq ruby-full wget

# --- Node.js ${node_major}.x LTS ----------------------------------------------
curl -fsSL https://deb.nodesource.com/setup_${node_major}.x | bash -
apt-get install -y nodejs
npm install -g pm2

# --- AWS CodeDeploy agent ------------------------------------------------------
cd /tmp
wget -q https://aws-codedeploy-${aws_region}.s3.${aws_region}.amazonaws.com/latest/install
chmod +x ./install
./install auto
systemctl enable codedeploy-agent
systemctl start codedeploy-agent

# --- CloudWatch agent (ships app logs to ${log_group_name}) -------------------
wget -q https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i -E ./amazon-cloudwatch-agent.deb

mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWCONFIG'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/opt/silas-backend/current/logs/app.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/app.log"
          }
        ]
      }
    }
  }
}
CWCONFIG

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# --- App directory + runtime configuration -------------------------------------
# Only non-sensitive connection info goes here. DB_USERNAME / DB_PASSWORD and
# the JWT secrets are NOT written to disk — the app fetches them from Secrets
# Manager at boot via the instance's IAM role (see backend/src/config/secrets.js).
# Rotating either secret in Secrets Manager therefore does not require
# touching this file or redeploying.
mkdir -p /opt/silas-backend/current/logs
mkdir -p /opt/silas-backend/releases

cat > /opt/silas-backend/current/.env << ENVCONFIG
NODE_ENV=production
PORT=${app_port}
AWS_REGION=${aws_region}
DB_HOST=${db_host}
DB_PORT=5432
DB_NAME=${db_name}
DB_CREDENTIALS_SECRET_ARN=${db_credentials_secret_arn}
JWT_SECRET_ARN=${jwt_secret_arn}
UPLOADS_BUCKET=${uploads_bucket}
ENVCONFIG

chown -R ubuntu:ubuntu /opt/silas-backend

echo "Bootstrap complete: $(date -u) — awaiting first CodeDeploy revision."

#!/bin/bash
# Runs after CodeDeploy has copied the new revision to /opt/silas-backend/current.
set -eux
cd /opt/silas-backend/current
npm ci --omit=dev
mkdir -p logs
chown -R ubuntu:ubuntu /opt/silas-backend/current

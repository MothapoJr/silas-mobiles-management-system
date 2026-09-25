#!/bin/bash
set -eux
cd /opt/silas-backend/current
sudo -u ubuntu pm2 startOrReload ecosystem.config.js --env production
sudo -u ubuntu pm2 save

#!/bin/bash
# CodeDeploy's last hook — if this doesn't exit 0, auto-rollback (enabled
# in the deployment group, see infrastructure/terraform/modules/compute)
# reverts to the previous revision automatically.
set -eu

for i in $(seq 1 10); do
  if curl --fail --silent --max-time 3 "http://localhost:3000/health" > /dev/null; then
    echo "Health check passed on attempt $i"
    exit 0
  fi
  echo "Health check attempt $i failed, retrying..."
  sleep 3
done

echo "Health check did not pass after 10 attempts"
exit 1

#!/bin/bash
# Runs BEFORE the new revision's files are copied in. `|| true` because the
# very first deployment to a fresh instance has no previous process to stop.
set -eu
pm2 stop silas-backend || true

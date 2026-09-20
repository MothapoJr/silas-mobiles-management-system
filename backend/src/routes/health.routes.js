// Used by the ALB target group's own health check (hits the instance
// directly, never goes through CloudFront) and by CodeDeploy's
// ValidateService hook (see backend/scripts/validate_service.sh). Stays
// dependency-free on purpose — a healthy process should answer here even
// if the database is briefly unreachable, so this never becomes the thing
// that hides a real outage as a "failed deploy."
const express = require('express');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'silas-mobiles-backend',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

// Plain, non-secret configuration. Read directly from process.env everywhere
// else in the app so there's exactly one place that knows about dotenv.
require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  awsRegion: process.env.AWS_REGION || 'af-south-1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'silas_mobiles',
  },

  uploadsBucket: process.env.UPLOADS_BUCKET,

  secretsManager: {
    dbCredentialsArn: process.env.DB_CREDENTIALS_SECRET_ARN,
    jwtSecretArn: process.env.JWT_SECRET_ARN,
  },
};

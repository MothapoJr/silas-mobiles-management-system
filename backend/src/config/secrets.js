// Resolves DB credentials and JWT signing secrets.
//
// In staging/production, these come from AWS Secrets Manager at boot, using
// the EC2 instance's IAM role — the values are never written to disk (see
// infrastructure/terraform/modules/security for the two secrets, and
// modules/compute's user-data template for what *is* written to disk:
// only the non-secret connection info).
//
// In development/test, no AWS credentials are assumed to be available, so
// this reads the same values from environment variables instead. That's
// the switch below — not a fallback for when the AWS call fails, but a
// deliberate environment check, so `npm test` never needs AWS access.
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const env = require('./env');

async function loadSecrets() {
  if (env.nodeEnv !== 'production' && env.nodeEnv !== 'staging') {
    return {
      dbUsername: process.env.DB_USERNAME,
      dbPassword: process.env.DB_PASSWORD,
      jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
      jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    };
  }

  const client = new SecretsManagerClient({ region: env.awsRegion });

  const [dbSecret, jwtSecret] = await Promise.all([
    client.send(
      new GetSecretValueCommand({ SecretId: env.secretsManager.dbCredentialsArn })
    ),
    client.send(
      new GetSecretValueCommand({ SecretId: env.secretsManager.jwtSecretArn })
    ),
  ]);

  const dbCredentials = JSON.parse(dbSecret.SecretString);
  const jwtSecrets = JSON.parse(jwtSecret.SecretString);

  return {
    dbUsername: dbCredentials.username,
    dbPassword: dbCredentials.password,
    jwtAccessSecret: jwtSecrets.access_token_secret,
    jwtRefreshSecret: jwtSecrets.refresh_token_secret,
  };
}

module.exports = { loadSecrets };

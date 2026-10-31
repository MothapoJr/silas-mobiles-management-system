// Resolves DB credentials and JWT signing secrets.
//
// Three modes:
//   1. development / test      -> plain environment variables (no AWS needed).
//   2. staging / production    -> AWS Secrets Manager, when both secret ARNs are
//                                 configured (the AWS/Terraform deployment).
//   3. staging / production    -> plain environment variables, when no ARNs are
//      WITHOUT secret ARNs        set (PaaS deployment such as Render, where the
//                                 platform's encrypted env store holds the secrets).
//
// Mode 3 is deliberately strict: every value must be present and the JWT secrets
// must not be the dev-only placeholders, otherwise the app refuses to start
// instead of silently running with weak credentials.
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const env = require('./env');

function fromEnvironment() {
  return {
    dbUsername: process.env.DB_USERNAME,
    dbPassword: process.env.DB_PASSWORD,
    jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  };
}

function assertSafeForDeployment(secrets) {
  const missing = Object.entries(secrets)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length > 0) {
    throw new Error(
      `Missing required secrets for ${env.nodeEnv}: ${missing.join(', ')}. ` +
        'Set DB_USERNAME, DB_PASSWORD, JWT_ACCESS_SECRET and JWT_REFRESH_SECRET, ' +
        'or configure the AWS Secrets Manager ARNs.'
    );
  }
  const weak = [secrets.jwtAccessSecret, secrets.jwtRefreshSecret].some(
    (value) => value.startsWith('dev-only') || value.length < 32
  );
  if (weak) {
    throw new Error(
      'JWT secrets must be at least 32 characters and not a dev-only placeholder.'
    );
  }
}

async function loadSecrets() {
  const deployed = env.nodeEnv === 'production' || env.nodeEnv === 'staging';
  if (!deployed) {
    return fromEnvironment();
  }

  const { dbCredentialsArn, jwtSecretArn } = env.secretsManager;
  if (!dbCredentialsArn || !jwtSecretArn) {
    const secrets = fromEnvironment();
    assertSafeForDeployment(secrets);
    return secrets;
  }

  const client = new SecretsManagerClient({ region: env.awsRegion });

  const [dbSecret, jwtSecret] = await Promise.all([
    client.send(new GetSecretValueCommand({ SecretId: dbCredentialsArn })),
    client.send(new GetSecretValueCommand({ SecretId: jwtSecretArn })),
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
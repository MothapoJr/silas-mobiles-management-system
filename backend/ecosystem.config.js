// pm2 process definition — keeps the process manager's own configuration
// out of the CodeDeploy hook scripts, so those stay one-liners.
module.exports = {
  apps: [
    {
      name: 'silas-backend',
      script: './src/index.js',
      cwd: '/opt/silas-backend/current',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      out_file: '/opt/silas-backend/current/logs/app.log',
      error_file: '/opt/silas-backend/current/logs/app.log',
      merge_logs: true,
      time: true,
    },
  ],
};

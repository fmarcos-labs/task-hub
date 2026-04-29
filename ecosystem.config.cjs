module.exports = {
  apps: [
    {
      name: 'task-hub',
      script: 'dist/main.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '256M',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      time: true,
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};

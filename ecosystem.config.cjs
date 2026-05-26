// pm2 ecosystem config — run with: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'music-backend',
      script: './dist/server.js',
      instances: 1,
      autorestart: true,         // Restart automatically on crash
      watch: false,              // Don't watch files in production
      max_memory_restart: '512M', // Restart if memory exceeds 512MB
      restart_delay: 3000,       // Wait 3s before restarting after crash
      max_restarts: 10,          // Max restart attempts before giving up
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Logging
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};

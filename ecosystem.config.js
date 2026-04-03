module.exports = {
  apps: [
    {
      name: 'zalo-agent',
      script: './zalo-agent-server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Auto restart on file changes
      watch: ['zalo-agent-server.js'],
      ignore_watch: ['node_modules', 'knowledge_base.json', 'logs'],
      // Logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      // Process management
      max_memory_restart: '1G',
      max_restarts: 10,
      min_uptime: '10s',
      // Health check
      listen_timeout: 3000,
      kill_timeout: 5000,
      // Graceful shutdown
      shutdown_with_message: true
    }
  ],

  // Deploy configuration
  deploy: {
    production: {
      user: 'www-data',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:username/zalo-chatbot-agent.git',
      path: '/home/www-data/zalo-agent',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    },
    staging: {
      user: 'www-data',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:username/zalo-chatbot-agent.git',
      path: '/home/www-data/zalo-agent-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  }
};

/**
 * PM2 Cheat Sheet:
 * 
 * # Start
 * pm2 start ecosystem.config.js
 * pm2 start ecosystem.config.js --env production
 * 
 * # Stop/Restart
 * pm2 stop zalo-agent
 * pm2 restart zalo-agent
 * pm2 reload zalo-agent  # Graceful reload
 * 
 * # Logs
 * pm2 logs zalo-agent
 * pm2 logs zalo-agent --lines 100 --err
 * 
 * # Status
 * pm2 status
 * pm2 info zalo-agent
 * pm2 monit
 * 
 * # Delete
 * pm2 delete zalo-agent
 * pm2 delete all
 * 
 * # Startup (auto-start on reboot)
 * pm2 startup
 * pm2 save
 * 
 * # Deployment
 * pm2 deploy ecosystem.config.js production setup
 * pm2 deploy ecosystem.config.js production
 * 
 * # Monitoring
 * pm2 web  # Access at http://localhost:9615
 * 
 */

module.exports = {
  apps: [
    {
      name: "nutriapp",
      script: "npm",
      args: "start",
      cwd: "/home/ubuntu/AppNutri/Desktop/AppNutrición",
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      exp_backoff_restart_delay: 1000,
      max_restarts: 10,
      min_uptime: 5000,
      kill_timeout: 5000,
      wait_ready: false,
      autorestart: true,
    },
  ],
};

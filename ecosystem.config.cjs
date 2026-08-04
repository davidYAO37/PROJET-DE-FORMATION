module.exports = {
  apps: [
    {
      name: "easy",
      cwd: "C:\\Users\\DAVID-YAO-PC\\Desktop\\GOMYCODE\\PROJET DE FORMATION\\easy_medical",
      script: "./node_modules/next/dist/bin/next",
      args: "start -H 0.0.0.0 -p 3000",
      interpreter: "node",
      env: {
        NODE_ENV: "production"
      },
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      instances: 1
    }
  ]
};
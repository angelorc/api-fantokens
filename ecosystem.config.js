module.exports = {
  apps: [
    {
      name: 'api-fantokens',
      port: '3000',
      exec_mode: 'cluster',
      instances: 'max',
      script: './.output/server/index.mjs'
    }
  ]
}
//https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: '2025-02-22',
  
  srcDir: "server",

  experimental: {
    tasks: true,
    asyncContext: true,
  },

  scheduledTasks: {
    '*/5 * * * *': ['ingest'],
    '*/30 * * * *': ['fantokens:import'],
  }
});

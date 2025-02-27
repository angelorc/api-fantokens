//https://nitro.unjs.io/config
export default defineNitroConfig({
  compatibilityDate: '2025-02-22',
  
  srcDir: "server",

  experimental: {
    asyncContext: true,
  },
});

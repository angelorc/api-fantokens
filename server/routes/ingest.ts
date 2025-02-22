export default defineEventHandler(async (event) => {
  const { result } = await runTask('ingest');
  return { result };
})
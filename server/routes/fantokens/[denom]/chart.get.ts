import { db } from "~~/db"
import { 
  one_hour_candle,
  one_day_candle,
  one_week_candle,
  one_month_candle
} from "~~/db/schema"
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export default defineEventHandler(async (event) => {
  const schema = z.object({
    tf: z.string().trim().optional().default('1h')
  })

  const { tf } = await getValidatedQuery(event, schema.parse);
  
  const denom = getRouterParam(event, 'denom');
  if (!denom) {
    throw new Error('denom is required');
  }

  const tableMapping = {
    '1h': one_hour_candle,
    '1d': one_day_candle,
    '7d': one_week_candle,
    '30d': one_month_candle
  }

  const selectedTable = tableMapping[tf.toLowerCase()] || tableMapping['1h'];

  const result = await db
    .select({
      time: sql<number>`extract(epoch from ${selectedTable}.bucket)`.mapWith(Number),
      open: sql<number>`coalesce(cast(${selectedTable}.open as numeric), 0)`.mapWith(Number),
      high: sql<number>`coalesce(cast(${selectedTable}.high as numeric), 0)`.mapWith(Number),
      low: sql<number>`coalesce(cast(${selectedTable}.low as numeric), 0)`.mapWith(Number),
      close: sql<number>`coalesce(cast(${selectedTable}.close as numeric), 0)`.mapWith(Number),
      volume: sql<number>`0`.mapWith(Number),
    })
    .from(selectedTable)
    .where(eq(selectedTable.denom, denom))
    .orderBy(asc(selectedTable.bucket))
    .limit(500)

  if (!result) {
    throw new Error('No data found');
  }

  return result
})
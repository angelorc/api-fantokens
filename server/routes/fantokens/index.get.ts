import { db } from "~~/db"
import { fantokens, prices } from "~~/db/schema"
import { eq, sql } from "drizzle-orm";
import { ibcDenom } from "~/utils";
import BigNumber from "bignumber.js";

export default defineEventHandler(async (event) => {
  const results = await db
    .select({
      denom: fantokens.denom,
      symbol: fantokens.symbol,
      name: fantokens.name,
      decimals: sql<number>`coalesce(fantokens.decimals, 0)`.mapWith(Number),
      supply: sql<number>`coalesce(fantokens.supply, 0)`.mapWith(Number),
      logo: fantokens.logo,
      coingecko_id: fantokens.coingecko_id,
      slug: fantokens.slug,
      price: sql<number>`coalesce(prices.last_price, 0)`.mapWith(Number),
      'price_1h_change': sql<number>`coalesce(cast(prices."1h_pct_change" as numeric), 0)`.mapWith(Number),
      'price_1d_change': sql<number>`coalesce(cast(prices."1d_pct_change" as numeric), 0)`.mapWith(Number),
      'price_7d_change': sql<number>`coalesce(cast(prices."7d_pct_change" as numeric), 0)`.mapWith(Number),
      'price_30d_change': sql<number>`coalesce(cast(prices."30d_pct_change" as numeric), 0)`.mapWith(Number),
    })
    .from(fantokens)
    .leftJoin(prices, eq(fantokens.denom, prices.denom));

  return results.map(result => {
    const supply = new BigNumber(result.supply).div(10 ** result.decimals).toNumber();
    return {
      ...result,
      supply,
      market_cap: new BigNumber(result.price).multipliedBy(supply).toNumber(),
      ibc_denoms: {
        osmosis: ibcDenom(result.denom)
      }
    }
  }).sort((a, b) => b.market_cap - a.market_cap)
})
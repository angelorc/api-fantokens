import { db } from "~~/db";
import { inngest } from "./client";
import { prices_history } from "~~/db/schema";

export default inngest.createFunction(
  { 
    id: "fetch-prices",
    name: 'Fetch Prices',
    concurrency: 1,
  },
  { cron: "*/5 * * * *" },
  async ({ event, step }) => {
    const pools = await step.run('fetch-pools', async () => {
      return (await fetchPools()).pools;
    });

    const fantokens = await step.run('fetch-fantokens', async () => {
      return (await fetchBitsongSupply()).filter(coin => coin.denom.startsWith('ft'));
    });

    const btsgPrice = await step.run('fetch-coingecko-price', async () => {
      return await fetchCoingeckoPrice('btsg');
      // TODO: Implement rate limiting
      // if (!success && retryAfter) {
      //   throw new RetryAfterError("Hit Coingecko rate limit", retryAfter);
      // }
    });

    await step.run('save-prices', async () => {
      const prices = fantokens.map(fantoken => {
        // @ts-ignore
        const pool = getPoolByDenom(pools, fantoken.denom);
        if (!pool) {
          return { time: new Date(), denom: fantoken.denom, price: 0 };
        }

        const price = getPriceFromPool(pool, fantoken.denom);
        return { time: new Date(), denom: fantoken.denom, price: price * btsgPrice };
      }).sort((a, b) => b.price - a.price)
        .filter(price => price.price > 0)

      return await db.insert(prices_history).values(prices);
    });

    return {
      success: true
    };
  }
);
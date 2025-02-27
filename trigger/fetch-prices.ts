import { logger, schedules, wait } from "@trigger.dev/sdk/v3";
import { db } from "~~/db";
import { prices_history } from "~~/db/schema";
import { fetchPools, fetchBitsongSupply, fetchCoingeckoPrice, getPoolByDenom, getPriceFromPool } from "~/utils";

export const fetchPricesTask = schedules.task({
  id: "fetch-prices",
  cron: "*/5 * * * *",
  maxDuration: 60,
  queue: {
    concurrencyLimit: 1
  },
  retry: {
    maxAttempts: 4,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
    factor: 1.8,
    randomize: false,
  },
  run: async (payload, { ctx }) => {
    logger.log("Running prices ingestion task");

    const { pools } = await fetchPools();
    const fantokens = (await fetchBitsongSupply()).filter(coin => coin.denom.startsWith('ft'));
    const btsgPrice = await fetchCoingeckoPrice('btsg');

    const prices = fantokens.map(fantoken => {
      const pool = getPoolByDenom(pools, fantoken.denom);
      if (!pool) {
        return { time: new Date(), denom: fantoken.denom, price: 0 };
      }

      const price = getPriceFromPool(pool, fantoken.denom);
      return { time: new Date(), denom: fantoken.denom, price: price * btsgPrice };
    }).sort((a, b) => b.price - a.price)
      .filter(price => price.price > 0)

    await db.insert(prices_history).values(prices)

    logger.log('End prices ingestion task');

    return { result: "Success" };
  },
});
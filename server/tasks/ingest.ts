import {
  fetchBitsongSupply,
  fetchCoingeckoPrice,
  fetchPools,
  getPoolByDenom,
  getPriceFromPool
} from "~/utils";
import { db } from "~~/db";
import { prices_history } from "~~/db/schema";

export default defineTask({
  meta: {
    name: "ingest",
    description: "Run the prices ingestion task",
  },
  async run({ payload, context }) {
    console.log("Running prices ingestion task");

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
    })
      .sort((a, b) => b.price - a.price)
      .filter(price => price.price > 0)

      console.log(prices);

    await db.insert(prices_history).values(prices)

    console.log('End prices ingestion task');

    return { result: "Success" };
  },
});
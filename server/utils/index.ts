import { createHash } from "node:crypto";
import { PoolsResponse, SupplyResponse } from "~~/types";

export const fetchPools = async (nextKey?: string) => {
  const url = `https://lcd.osmosis.zone/osmosis/gamm/v1beta1/pools${nextKey ? `?pagination.key=${encodeURIComponent(nextKey)}` : ''}`;
  const response = await $fetch<PoolsResponse>(url);

  if (response.pagination.next_key) {
    const nextPools = await fetchPools(response.pagination.next_key);
    response.pools.push(...nextPools.pools);
  }

  const bitsongPools = response.pools
    .filter(pool => pool["@type"] === "/osmosis.gamm.v1beta1.Pool")
    .filter(pool => pool.pool_assets.some(asset => asset.token.denom === 'ibc/4E5444C35610CC76FC94E7F7886B93121175C28262DDFDDE6F84E82BF2425452' && Number(asset.token.amount) > 1_000_000_000))
  
  response.pools = bitsongPools;

  return response
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function ibcDenom(denom: string): string {
  return `ibc/${sha256(`transfer/channel-73/${denom}`).toUpperCase()}`;
}

export function getPoolByDenom(pools: PoolsResponse['pools'], denom: string): PoolsResponse['pools'][0] | undefined {
  const _pools = pools.filter(pool => pool.pool_assets.some(asset => asset.token.denom === ibcDenom(denom)));
  _pools.sort((a, b) => {
    const assetA = a.pool_assets.find(asset => asset.token.denom === ibcDenom('ubtsg'));
    const assetB = b.pool_assets.find(asset => asset.token.denom === ibcDenom('ubtsg'));
    return Number(assetB!.token.amount) - Number(assetA!.token.amount);
  });
  return _pools.length > 0 ? _pools[0] : undefined;
}

export function getPriceFromPool(pool: PoolsResponse['pools'][0], denom: string): number {
  console.log(`--------- Pool: ${pool.id} ---------`);
  const assetA = pool.pool_assets.find(asset => asset.token.denom === ibcDenom('ubtsg'));
  console.log(`Denom: ubtsg, Asset A: ${assetA!.token.amount}`);
  const assetB = pool.pool_assets.find(asset => asset.token.denom === ibcDenom(denom));
  console.log(`Denom: ${denom}, Asset B: ${assetB!.token.amount}`);

  const price = Number(assetA!.token.amount) / Number(assetB!.token.amount);
  console.log(`Price: ${price}`);
  return price;
}

export const fetchCoingeckoPrice = defineCachedFunction(async (denom: string) => {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitsong&vs_currencies=usd`;
  const response = await $fetch<{ bitsong: { usd: number } }>(url);
  return response.bitsong.usd;
}, {
  maxAge: 15, // 15 seconds
  getKey: (denom) => denom,
})

export async function fetchBitsongSupply() {
  const response = await $fetch<SupplyResponse>(`https://lcd.explorebitsong.com/cosmos/bank/v1beta1/supply`);
  return response.supply
}
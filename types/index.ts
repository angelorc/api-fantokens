export type Pool = {
  '@type': string
  address: string
  id: string
  pool_params: {
    swap_fee: string
    exit_fee: string
    smooth_weight_change_params: null
  }
  future_pool_governor: string
  total_shares: {
    denom: string
    amount: string
  }
  pool_assets: {
    token: {
      denom: string
      amount: string
    }
    weight: string
  }[]
  total_weight: string
}

export type PoolsResponse = {
  pools: Pool[]
  pagination: {
    next_key?: string
    total: string
  }
}

export type Coin = {
  denom: string
  amount: string
}

export type SupplyResponse = {
  supply: Coin[]
}
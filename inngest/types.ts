import { EventSchemas } from "inngest";

type DemoEventSent = {
  name: "demo/event.sent";
  data: {
    message: string;
  };
};

type BitsongFetchSupply = {
  name: "bitsong/fetch.supply";
};

type OsmosisFetchPrices = {
  name: "osmosis/fetch.prices";
};

export const schemas = new EventSchemas().fromUnion<DemoEventSent | BitsongFetchSupply | OsmosisFetchPrices>();
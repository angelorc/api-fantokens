import fetchSupply from "./fetchSupply";
import fetchPrices from "./fetchPrices";
import dbBackup from "./dbBackup";

export const functions = [
  fetchSupply,
  fetchPrices,
  dbBackup,
];

export { inngest } from "./client";
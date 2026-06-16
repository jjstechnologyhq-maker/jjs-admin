/**
 * MSW handler aggregator
 * Add new handler arrays here as modules are built
 */

import { authHandlers } from "./auth";
import { kycHandlers } from "./kyc";
import { usersHandlers } from "./users";
import { withdrawalsHandlers } from "./withdrawals";
import { transactionsHandlers } from "./transactions";
import { analyticsHandlers } from "./analytics";
import { feesHandlers } from "./fees";
import { liquidityHandlers } from "./liquidity";
import { adminHandlers } from "./admin";

export const handlers = [
  ...authHandlers,
  ...kycHandlers,
  ...usersHandlers,
  ...withdrawalsHandlers,
  ...transactionsHandlers,
  ...analyticsHandlers,
  ...feesHandlers,
  ...liquidityHandlers,
  ...adminHandlers,
];

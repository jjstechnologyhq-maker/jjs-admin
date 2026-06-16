/**
 * MSW browser worker setup
 * Only used in development — never imported in production builds
 */

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai_chat_storage from "../ai/chat_storage.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as mutations_deleteAccount from "../mutations/deleteAccount.js";
import type * as mutations_uploadDataset from "../mutations/uploadDataset.js";
import type * as mutations_wipeData from "../mutations/wipeData.js";
import type * as queries_getCurrentUser from "../queries/getCurrentUser.js";
import type * as queries_getDatasetForAi from "../queries/getDatasetForAi.js";
import type * as queries_getLatestDataset from "../queries/getLatestDataset.js";
import type * as queries_getWorkoutSets from "../queries/getWorkoutSets.js";
import type * as rateLimits from "../rateLimits.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "ai/chat_storage": typeof ai_chat_storage;
  auth: typeof auth;
  http: typeof http;
  "mutations/deleteAccount": typeof mutations_deleteAccount;
  "mutations/uploadDataset": typeof mutations_uploadDataset;
  "mutations/wipeData": typeof mutations_wipeData;
  "queries/getCurrentUser": typeof queries_getCurrentUser;
  "queries/getDatasetForAi": typeof queries_getDatasetForAi;
  "queries/getLatestDataset": typeof queries_getLatestDataset;
  "queries/getWorkoutSets": typeof queries_getWorkoutSets;
  rateLimits: typeof rateLimits;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};

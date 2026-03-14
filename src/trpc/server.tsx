import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { cache } from "react";
import { createTRPCContext } from "./init";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./routers/_app";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: generic helper mirrors tRPC docs pattern
export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const qc = getQueryClient();
  // biome-ignore lint/suspicious/noExplicitAny: infinite query type narrowing
  if ((queryOptions.queryKey[1] as any)?.type === "infinite") {
    // biome-ignore lint/suspicious/noExplicitAny: infinite query type narrowing
    void qc.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void qc.prefetchQuery(queryOptions);
  }
}

export const caller = appRouter.createCaller(createTRPCContext);

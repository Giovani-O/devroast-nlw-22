import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { RoastResultsClient } from "./_components/roast-results-client";

async function RoastResultsPageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  prefetch(trpc.analysis.getById.queryOptions({ id }));

  return (
    <HydrateClient>
      <RoastResultsClient id={id} />
    </HydrateClient>
  );
}

export default function RoastResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="w-full flex flex-col" style={{ gap: "40px" }}>
          <div className="w-full flex items-center" style={{ gap: "48px" }}>
            <Skeleton className="w-[180px] h-[180px] rounded-full" />
            <div className="flex-1 flex flex-col" style={{ gap: "16px" }}>
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </div>
      }
    >
      <RoastResultsPageContent params={params} />
    </Suspense>
  );
}

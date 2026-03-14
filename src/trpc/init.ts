import crypto from "node:crypto";
import { initTRPC } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db/client";

export const createTRPCContext = cache(async () => {
  const h = await headers();
  const ip = h.get("x-forwarded-for") ?? "unknown";
  const ua = h.get("user-agent") ?? "";
  return {
    db,
    ipHash: crypto.createHash("sha256").update(ip).digest("hex"),
    userAgentHash: crypto.createHash("sha256").update(ua).digest("hex"),
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

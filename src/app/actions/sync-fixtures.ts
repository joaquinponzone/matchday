"use server"

import { revalidatePath } from "next/cache"

import { verifySession } from "@/lib/dal"

/** Manual refresh: client should invalidate TanStack Query; this only revalidates RSC if needed. */
export async function syncFixtures() {
  await verifySession()
  revalidatePath("/")
}

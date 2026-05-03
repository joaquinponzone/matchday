"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/dal"
import {
  createUserSettings,
  deleteUser,
  updateUserRole,
  updateUserStatus,
} from "@/server/db/queries"

export async function approveUser(userId: number) {
  await requireAdmin()
  await updateUserStatus(userId, "active")
  await createUserSettings(userId)
  revalidatePath("/admin/users")
}

export async function rejectUser(userId: number) {
  await requireAdmin()
  await updateUserStatus(userId, "rejected")
  revalidatePath("/admin/users")
}

export async function changeRole(userId: number, role: string) {
  await requireAdmin()
  if (role !== "admin" && role !== "user") return
  await updateUserRole(userId, role)
  revalidatePath("/admin/users")
}

export async function deleteUserAction(userId: number) {
  await requireAdmin()
  await deleteUser(userId)
  revalidatePath("/admin/users")
}

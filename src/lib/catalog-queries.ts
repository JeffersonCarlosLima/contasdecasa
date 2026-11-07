import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paymentMethods } from "@/db/schema";

export async function listCategories(familyId: string) {
  return db
    .select()
    .from(categories)
    .where(
      and(
        eq(categories.familyId, familyId),
        eq(categories.archived, false)
      )
    )
    .orderBy(categories.name);
}

export async function listPaymentMethods(
  familyId: string,
  options?: { includeArchived?: boolean }
) {
  const conditions = [eq(paymentMethods.familyId, familyId)];
  if (!options?.includeArchived) {
    conditions.push(eq(paymentMethods.archived, false));
  }

  return db
    .select()
    .from(paymentMethods)
    .where(and(...conditions))
    .orderBy(paymentMethods.name);
}

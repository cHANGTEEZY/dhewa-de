import { eq } from "drizzle-orm";
import { db } from "../../db";
import { user } from "../../db/schema/auth";

export const usersRepository = {
  async findById(id: string) {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    return record ?? null;
  },

  async updateProfile(id: string, input: { name: string; username: string }) {
    const [taken] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, input.username))
      .limit(1);

    if (taken && taken.id !== id) {
      return { ok: false as const, error: "USERNAME_TAKEN" as const };
    }

    try {
      const [record] = await db
        .update(user)
        .set({
          name: input.name,
          username: input.username,
          updatedAt: new Date(),
        })
        .where(eq(user.id, id))
        .returning();

      if (!record) return { ok: false as const, error: "NOT_FOUND" as const };
      return { ok: true as const, record };
    } catch (error) {
      if (isUniqueViolation(error)) {
        return { ok: false as const, error: "USERNAME_TAKEN" as const };
      }
      throw error;
    }
  },
};

function isUniqueViolation(error: unknown): boolean {
  const candidates = [error, causeOf(error)];
  return candidates.some(
    (candidate) =>
      typeof candidate === "object" &&
      candidate !== null &&
      "code" in candidate &&
      (candidate as { code?: unknown }).code === "23505",
  );
}

function causeOf(error: unknown) {
  if (typeof error !== "object" || error === null || !("cause" in error)) {
    return undefined;
  }
  return (error as { cause?: unknown }).cause;
}

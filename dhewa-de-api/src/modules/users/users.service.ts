import { usersRepository } from "./users.repository";
import type { PublicUser } from "./users.types";

function toPublicUser(record: {
  id: string;
  name: string;
  username: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser {
  return {
    id: record.id,
    name: record.name,
    username: record.username,
    email: record.email,
    emailVerified: record.emailVerified,
    image: record.image,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const usersService = {
  async getProfile(userId: string) {
    const record = await usersRepository.findById(userId);
    if (!record) return null;
    return toPublicUser(record);
  },

  async updateProfile(userId: string, input: { name: string; username: string }) {
    const result = await usersRepository.updateProfile(userId, input);
    if (!result.ok) return result;
    return { ok: true as const, profile: toPublicUser(result.record) };
  },
};

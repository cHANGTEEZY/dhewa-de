import { z } from "zod";

export const publicUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const usernameMessage = "Use 3–30 letters, numbers, or underscores";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  username: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(
      z
        .string()
        .min(3, usernameMessage)
        .max(30, usernameMessage)
        .regex(/^[a-z0-9_]+$/, usernameMessage),
    ),
});

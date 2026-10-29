import { resolver } from "hono-openapi";
import { z } from "zod";
import { publicUserSchema } from "./users.validator";

export const usersTags = ["Users"];

export const userProfileResponseSchema = z.object({
  success: z.literal(true),
  data: publicUserSchema,
  requestId: z.string(),
});

export const usersErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  requestId: z.string(),
});

export const emailVerificationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    sent: z.boolean(),
    alreadyVerified: z.boolean(),
    verificationUrl: z.string().optional(),
  }),
  requestId: z.string(),
});

const errorResponse = {
  description: "Request failed",
  content: {
    "application/json": {
      schema: resolver(usersErrorSchema),
    },
  },
};

export const usersDocs = {
  getMe: {
    tags: usersTags,
    summary: "Get current user profile",
    description: "Returns the authenticated user's profile from the database.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: "Current user profile",
        content: {
          "application/json": {
            schema: resolver(userProfileResponseSchema),
          },
        },
      },
      401: {
        description: "Not authenticated",
        content: {
          "application/json": {
            schema: resolver(usersErrorSchema),
          },
        },
      },
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: resolver(usersErrorSchema),
          },
        },
      },
    },
  },
  updateMe: {
    tags: usersTags,
    summary: "Update name and username",
    description: "Updates the authenticated user's display name and username.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: "Updated profile",
        content: {
          "application/json": {
            schema: resolver(userProfileResponseSchema),
          },
        },
      },
      401: errorResponse,
      404: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
  },
  sendEmailVerification: {
    tags: usersTags,
    summary: "Send an email verification link",
    description:
      "Issues a Better Auth verification link for the signed-in user. Outside production, the response includes the link because no mail transport is configured.",
    security: [{ cookieAuth: [] }],
    responses: {
      200: {
        description: "Verification link issued, or the email is already verified",
        content: {
          "application/json": {
            schema: resolver(emailVerificationResponseSchema),
          },
        },
      },
      401: errorResponse,
      404: errorResponse,
    },
  },
};

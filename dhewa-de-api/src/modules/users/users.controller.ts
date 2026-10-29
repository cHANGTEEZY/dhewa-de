import type { Context } from "hono";
import { takeIssuedVerificationUrl, auth } from "../auth/auth.service";
import { ajApi } from "../../shared/utils/arcjet";
import { handleArcjetDecision } from "../../shared/utils/arcjet-deny";
import { env } from "../../config/env";
import type { AppVariables } from "../../shared/types/app.types";
import { updateProfileSchema } from "./users.validator";
import { usersService } from "./users.service";

type UsersContext = Context<{ Variables: AppVariables }>;

export const usersController = {
  async getMe(c: UsersContext) {
    const decision = await ajApi.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
    const denied = handleArcjetDecision(c, decision);
    if (denied) return denied;

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
          requestId: c.get("requestId"),
        },
        401,
      );
    }

    const profile = await usersService.getProfile(currentUser.id);
    if (!profile) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          requestId: c.get("requestId"),
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: profile,
      requestId: c.get("requestId"),
    });
  },

  async updateMe(c: UsersContext) {
    const decision = await ajApi.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
    const denied = handleArcjetDecision(c, decision);
    if (denied) return denied;

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json(unauthorizedBody(c.get("requestId")), 401);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      body = null;
    }

    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        {
          success: false,
          error: {
            code: "VALIDATION",
            message: parsed.error.issues[0]?.message ?? "Invalid profile",
          },
          requestId: c.get("requestId"),
        },
        422,
      );
    }

    const result = await usersService.updateProfile(currentUser.id, parsed.data);
    if (!result.ok) {
      if (result.error === "USERNAME_TAKEN") {
        return c.json(
          {
            success: false,
            error: {
              code: "USERNAME_TAKEN",
              message: "That username is already taken",
            },
            requestId: c.get("requestId"),
          },
          409,
        );
      }

      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          requestId: c.get("requestId"),
        },
        404,
      );
    }

    return c.json({
      success: true,
      data: result.profile,
      requestId: c.get("requestId"),
    });
  },

  async sendEmailVerification(c: UsersContext) {
    const decision = await ajApi.protect(c.req.raw, {
      correlationId: c.get("requestId"),
    });
    const denied = handleArcjetDecision(c, decision);
    if (denied) return denied;

    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json(unauthorizedBody(c.get("requestId")), 401);
    }

    const profile = await usersService.getProfile(currentUser.id);
    if (!profile) {
      return c.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User not found",
          },
          requestId: c.get("requestId"),
        },
        404,
      );
    }

    if (profile.emailVerified) {
      return c.json({
        success: true,
        data: {
          sent: false,
          alreadyVerified: true,
        },
        requestId: c.get("requestId"),
      });
    }

    await auth.api.sendVerificationEmail({
      body: {
        email: profile.email,
        callbackURL: "/settings",
      },
      headers: c.req.raw.headers,
    });

    const verificationUrl = takeIssuedVerificationUrl(profile.id);

    return c.json({
      success: true,
      data: {
        sent: true,
        alreadyVerified: false,
        ...(env.NODE_ENV === "production" || !verificationUrl
          ? {}
          : { verificationUrl }),
      },
      requestId: c.get("requestId"),
    });
  },
};

function unauthorizedBody(requestId: string) {
  return {
    success: false as const,
    error: {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    },
    requestId,
  };
}

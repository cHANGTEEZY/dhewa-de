import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { requireAuth } from "../../middleware/require-auth";
import type { AppVariables } from "../../shared/types/app.types";
import { usersController } from "./users.controller";
import { usersDocs } from "./users.docs";

export const usersRoutes = new Hono<{ Variables: AppVariables }>();

usersRoutes.get(
  "/me",
  requireAuth(),
  describeRoute(usersDocs.getMe),
  (c) => usersController.getMe(c),
);

usersRoutes.patch(
  "/me",
  requireAuth(),
  describeRoute(usersDocs.updateMe),
  (c) => usersController.updateMe(c),
);

usersRoutes.post(
  "/me/email/verification",
  requireAuth(),
  describeRoute(usersDocs.sendEmailVerification),
  (c) => usersController.sendEmailVerification(c),
);

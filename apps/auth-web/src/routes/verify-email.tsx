import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { VerifyEmailPage } from "@/pages/verify-email";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
});

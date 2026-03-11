import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { ForgotPasswordPage } from "@/pages/forgot-password";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

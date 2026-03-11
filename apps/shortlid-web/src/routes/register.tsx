import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { RegisterPage } from "@/pages/register";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});


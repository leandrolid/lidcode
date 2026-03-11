import { createRoute } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { ProfilePage } from "@/pages/me";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/me",
  component: ProfilePage,
});

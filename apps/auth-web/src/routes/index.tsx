import { createRoute, redirect } from "@tanstack/react-router";
import { Route as rootRoute } from "./__root";
import { authClient } from "@/lib/auth-client";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (data?.session) {
      throw redirect({ to: "/me" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});

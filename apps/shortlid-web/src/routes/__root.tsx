import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthHeader } from "@/components/auth-header";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <>
      <AuthHeader />
      <Outlet />
    </>
  );
}

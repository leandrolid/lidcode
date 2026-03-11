import { RouterProvider } from "@tanstack/react-router";
import { ThemeProvider } from "@/providers/theme";
import { AuthProvider } from "@/providers/auth";
import { ToastProvider } from "@/providers/toast";
import { router } from "@/router";

export function Providers() {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <ToastProvider />
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

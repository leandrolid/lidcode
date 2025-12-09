import { Home } from "@/pages/home";
import { ThemeProvider } from "@/providers/theme";
import { ToastProvider } from "@/providers/toast";

export function Providers() {
  return (
    <>
      <ThemeProvider>
        <Home />
        <ToastProvider />
      </ThemeProvider>
    </>
  );
}

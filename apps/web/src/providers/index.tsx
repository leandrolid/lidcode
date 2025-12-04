import { App } from "@/app";
import { ThemeProvider } from "@/providers/theme";
import { ToastProvider } from "@/providers/toast";

export function Providers() {
  return (
    <>
      <ThemeProvider>
        <App />
        <ToastProvider />
      </ThemeProvider>
    </>
  );
}

import { ThemeProvider as NextTheme } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextTheme enableColorScheme attribute="class" defaultTheme="dark">
      {children}
    </NextTheme>
  );
}

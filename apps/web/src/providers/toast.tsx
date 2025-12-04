import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      swipeDirections={["left", "right"]}
      richColors
      style={{ userSelect: "none" }}
    />
  );
}

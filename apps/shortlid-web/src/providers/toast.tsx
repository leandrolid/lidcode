import { Toaster } from "@/components/ui/sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      swipeDirections={["left", "right"]}
      toastOptions={{ className: "shortlid-toast" }}
      closeButton
    />
  );
}

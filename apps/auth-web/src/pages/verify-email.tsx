import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { LoaderCircleIcon, CheckCircle, XCircle } from "lucide-react";

type VerifyState = "loading" | "success" | "error" | "no-token";

export function VerifyEmailPage() {
  const [token] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  });
  const [state, setState] = useState<VerifyState>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ? "loading" : "no-token";
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `${env.VITE_AUTH_URL}/v1/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (response.ok) {
          setState("success");
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {state === "loading" && (
              <div className="flex flex-col items-center gap-3">
                <LoaderCircleIcon className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Verifying your email...</p>
              </div>
            )}
            {state === "success" && (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <p className="font-medium">Email verified successfully!</p>
                <p className="text-sm text-muted-foreground">
                  Your email has been verified. You can now sign in.
                </p>
                <Button asChild className="w-full mt-2">
                  <Link to="/login">Go to login</Link>
                </Button>
              </div>
            )}
            {state === "error" && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <p className="font-medium">Verification failed</p>
                <p className="text-sm text-muted-foreground">
                  The link may have expired. Please try registering again.
                </p>
                <Button asChild variant="outline" className="w-full mt-2">
                  <Link to="/register">Go to register</Link>
                </Button>
              </div>
            )}
            {state === "no-token" && (
              <div className="flex flex-col items-center gap-3">
                <XCircle className="h-8 w-8 text-destructive" />
                <p className="font-medium">No verification token found</p>
                <p className="text-sm text-muted-foreground">
                  Please check the link in your email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

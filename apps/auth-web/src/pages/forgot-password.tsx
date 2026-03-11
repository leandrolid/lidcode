import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { LoaderCircleIcon } from "lucide-react";

type Mode = "request" | "reset";
type State = "idle" | "submitting" | "success" | "error";

export function ForgotPasswordPage() {
  const [mode] = useState<Mode>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ? "reset" : "request";
  });
  const [token] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setState("submitting");

    // NOTE: auth-server does not have sendResetPasswordEmail configured yet.
    // This call will succeed but no email will be sent until the server is updated.
    // @ts-expect-error - better-auth may not have forgetPassword typed correctly
    await authClient.forgetPassword({
      email,
      redirectTo: window.location.origin + "/forgot-password",
    });

    // Always show success (vague for security — don't reveal if email exists)
    setState("success");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setState("submitting");

    const result = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    if (result.error) {
      setState("error");
    } else {
      setState("success");
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === "request" ? "Forgot Password" : "Reset Password"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Mode 1: Request reset */}
            {mode === "request" && state !== "success" && (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={state === "submitting"} className="w-full">
                  {state === "submitting" ? (
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
            {mode === "request" && state === "success" && (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  If an account exists for that email, you'll receive a password reset link.
                </p>
              </div>
            )}

            {/* Mode 2: Reset password */}
            {mode === "reset" && state !== "success" && state !== "error" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {errorMsg && (
                  <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={state === "submitting"} className="w-full">
                  {state === "submitting" ? (
                    <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reset password"
                  )}
                </Button>
              </form>
            )}
            {mode === "reset" && state === "success" && (
              <div className="text-center space-y-4">
                <p className="font-medium text-green-500">Password reset successfully!</p>
                <Button asChild className="w-full">
                  <Link to="/login">Go to login</Link>
                </Button>
              </div>
            )}
            {mode === "reset" && state === "error" && (
              <div className="text-center space-y-4">
                <p className="font-medium text-destructive">Reset failed</p>
                <p className="text-sm text-muted-foreground">
                  The link may have expired.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/forgot-password">Request a new reset link</Link>
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

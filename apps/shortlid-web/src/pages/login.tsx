import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth";
import { authClient } from "@/lib/auth-client";
import { env } from "@/env";
import { LoaderCircleIcon, Github, Mail } from "lucide-react";
import map from "/map.svg";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn(email, password);

      if (result.error) {
        // @ts-expect-error better-auth types for error are opaque
        const message = result.error?.message || "Invalid email or password.";
        setError(message);
        setIsSubmitting(false);
      } else {
        navigate({ to: "/" });
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
  };

  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center px-4 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('${map}')`,
      }}
    >
      <div className="w-full max-w-md space-y-6 p-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="text-sm text-gray-400">
            Sign in to manage your shortened links
          </p>
        </div>

        <Card className="w-full border-neutral-800 bg-neutral-900/60 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
          <CardHeader className="space-y-1 text-center pb-4">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(env.VITE_ENABLE_GOOGLE_AUTH ||
              env.VITE_ENABLE_GITHUB_AUTH) && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {env.VITE_ENABLE_GITHUB_AUTH && (
                    <Button
                      variant="outline"
                      className="bg-neutral-900/50 hover:bg-neutral-800 border-neutral-800 transition-all duration-300"
                      onClick={() => handleSocialSignIn("github")}
                    >
                      <Github className="mr-2 h-4 w-4" />
                      GitHub
                    </Button>
                  )}
                  {env.VITE_ENABLE_GOOGLE_AUTH && (
                    <Button
                      variant="outline"
                      className="bg-neutral-900/50 hover:bg-neutral-800 border-neutral-800 transition-all duration-300"
                      onClick={() => handleSocialSignIn("google")}
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-neutral-900/80 px-2 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center animate-in fade-in zoom-in duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="relative group">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 bg-neutral-900/50 border-neutral-800 focus-visible:ring-blue-500/50 transition-all duration-300"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                </div>

                <div className="relative group">
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 bg-neutral-900/50 border-neutral-800 focus-visible:ring-blue-500/50 transition-all duration-300"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 group-focus-within:text-blue-500 transition-colors"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 relative overflow-hidden"
              >
                {isSubmitting ? (
                  <LoaderCircleIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 pt-2 pb-6 text-center text-sm text-gray-400">
            <p>
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

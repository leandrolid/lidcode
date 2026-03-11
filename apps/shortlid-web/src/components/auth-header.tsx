import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/providers/auth";
import { Button } from "@/components/ui/button";

export function AuthHeader() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isAuthenticated ? (
        <Button asChild>
          <Link to="/login">Sign in</Link>
        </Button>
      ) : (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-full border bg-background p-1 pr-3 shadow-sm hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium">{user?.name}</span>
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background p-1 shadow-md">
              <div className="px-2 py-1.5 text-sm text-muted-foreground border-b mb-1">
                <p className="truncate font-medium text-foreground">{user?.name}</p>
                <p className="truncate text-xs">{user?.email}</p>
              </div>
              <div className="flex flex-col space-y-1">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-sm h-8 px-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-sm h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

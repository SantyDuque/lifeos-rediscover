import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sessionQuery, useSignIn } from "@/lib/queries";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — LifeOS" },
      {
        name: "description",
        content: "Sign in to your LifeOS workspace to pick up habits, tasks and reviews.",
      },
      { property: "og:title", content: "Sign in — LifeOS" },
      { property: "og:description", content: "Access your personal operating system." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "sign-in" | "sign-up";

function AuthPage() {
  const navigate = useNavigate();
  const session = useQuery(sessionQuery);
  const signIn = useSignIn();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("santiago@lifeos.app");
  const [password, setPassword] = useState("");

  const signedIn = session.data?.status === "signed-in";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <p className="font-display text-2xl tracking-tight">LifeOS</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "sign-in"
              ? "Sign in to pick up where the day left off."
              : "Create the workspace you'll actually keep."}
          </p>
        </div>

        {signedIn ? (
          <div className="rounded-md border border-border p-4">
            <p className="text-sm">You're already signed in as {session.data.profile.name}.</p>
            <Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
              Go to Today
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signIn.mutate(
                { email, password },
                { onSuccess: () => navigate({ to: "/" }) },
              );
            }}
          >
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
                placeholder="At least six characters"
                required
              />
            </div>

            {signIn.isError ? (
              <p role="alert" className="text-xs text-destructive">
                {signIn.error instanceof Error ? signIn.error.message : "Couldn't sign you in."}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={signIn.isPending}>
              {signIn.isPending
                ? "Checking…"
                : mode === "sign-in"
                  ? "Sign in"
                  : "Create account"}
            </Button>

            <button
              type="button"
              onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
              className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        <p className="mt-10 text-[11px] leading-relaxed text-muted-foreground">
          Demo workspace — any six-character password works while the backend adapter is mocked.
        </p>
      </div>
    </main>
  );
}

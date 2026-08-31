import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingRows } from "@/components/lifeos/states";
import { sessionQuery } from "@/lib/queries";

/** Renders children only for a signed-in session; otherwise a quiet auth state. */
export function AuthGate({ children }: { children: ReactNode }) {
  const session = useQuery(sessionQuery);

  if (session.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10">
        <LoadingRows rows={5} />
      </div>
    );
  }

  if (session.isError) {
    return (
      <div className="mx-auto w-full max-w-xl py-10">
        <ErrorState
          title="We couldn't verify your session"
          error={session.error}
          onRetry={() => session.refetch()}
        />
      </div>
    );
  }

  if (session.data?.status !== "signed-in") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center py-20 text-center">
        <LockKeyhole className="mb-4 size-5 text-muted-foreground" />
        <h2 className="text-lg">Your session ended</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign back in to pick up today where you left it.
        </p>
        <Button asChild className="mt-6">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

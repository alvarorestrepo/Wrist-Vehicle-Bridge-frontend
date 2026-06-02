import { LogIn, LogOut } from "lucide-react";

import { signIn, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function SignInWithGoogleButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signIn("google");
      }}
    >
      <Button type="submit" className="h-12 rounded-full bg-white px-7 text-black hover:bg-zinc-200">
        <LogIn className="size-4" aria-hidden="true" />
        Sign in with Google
      </Button>
    </form>
  );
}

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";

        await signOut({ redirectTo: "/" });
      }}
    >
      <Button
        type="submit"
        variant="outline"
        className="rounded-full border-white/15 bg-white/[0.04] px-4 text-white hover:bg-white/10 hover:text-white"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
